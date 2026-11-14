//! A program being run, for the interface (see *Running a program* in `specs.md`): [`Run`]
//! runs it one step at a time on a map of a level or in the sandbox.
//!
//! A step crosses as a word, and what the interface reads after each step as a number or a
//! boolean: at **Instant**, thousands of steps run between two frames, and an object would
//! cost several times the step itself. Everything else is a plain object built when the
//! interface asks for it, once per frame or when the program pauses: the world, how the run
//! ended, the calls in progress (see Bridge in `docs/technical-choices.md`).

use std::error::Error;
use std::fmt;

use serde::Serialize;
use stepwise_core::interpreter::{Action, CallInProgress, Event, State};
use stepwise_core::program::{self, Checked};
use stepwise_core::{level, run};
use tsify::{Ts, Tsify};
use wasm_bindgen::JsError;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::position::Offsets;
use crate::runtime_error::RuntimeError;
use crate::value::Value;
use crate::world::{Color, Point, World};

/// A program being run on a map of a level or in the sandbox, paused before its next step.
/// It stays in the module, with its own copy of the world: the interface frees it at
/// **Reset**, and starts another one at each **Run**.
#[wasm_bindgen]
#[derive(Debug)]
pub struct Run {
    /// The run of the core.
    core: run::Run,
    /// The lines of the source of the program, to place its error.
    offsets: Offsets,
    /// The line the last step printed, kept until the next step for the interface to read.
    printed: Option<String>,
}

/// What a step showed outside the editor: nothing, a line printed, which [`Run::printed`]
/// gives, or the action of the robot, by its name (`Action` in the core, where each is
/// described). A string in JavaScript, its type a union of the strings in TypeScript.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepEvent {
    Nothing = "nothing",
    Printed = "printed",
    Moved = "moved",
    TurnedLeft = "turned-left",
    TurnedRight = "turned-right",
    StartedPainting = "started-painting",
    StoppedPainting = "stopped-painting",
    StartedErasing = "started-erasing",
    StoppedErasing = "stopped-erasing",
    PickedUp = "picked-up",
    Dropped = "dropped",
}

/// Why a run doesn't start: a mistake of the interface, never of the learner.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartError {
    /// The checks before running refuse the program: `check` gives its errors, and the
    /// interface starts nothing while there is one.
    ProgramRefused,
    /// The level has no map of this index.
    NoSuchMap {
        /// The index asked, from 0.
        index: usize,
        /// The number of maps of the level.
        maps: usize,
    },
}

impl fmt::Display for StartError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match *self {
            Self::ProgramRefused => {
                write!(
                    formatter,
                    "the program has errors: check it before starting it"
                )
            }
            Self::NoSuchMap { index, maps } => {
                write!(formatter, "the level has no map {index}: it has {maps}")
            }
        }
    }
}

impl Error for StartError {}

impl Run {
    /// The run of the program of `source`, which `start` makes from the checked program.
    ///
    /// # Errors
    ///
    /// [`StartError::ProgramRefused`] when the checks before running refuse `source`.
    pub fn start(
        source: &str,
        start: impl FnOnce(&Checked) -> run::Run,
    ) -> Result<Self, StartError> {
        let program = program::check(source).map_err(|_| StartError::ProgramRefused)?;
        Ok(Self {
            core: start(&program),
            offsets: Offsets::new(source),
            printed: None,
        })
    }

    /// How the run ended, as [`Run::outcome`] gives it, before it crosses to JavaScript.
    #[must_use]
    pub fn ended(&self) -> Option<Outcome> {
        let outcome = match self.core.outcome()? {
            run::Outcome::Ended => Outcome::Ended,
            run::Outcome::Passed => Outcome::Passed,
            run::Outcome::GoalsNotMet(not_met) => Outcome::GoalsNotMet {
                goals: not_met.into_iter().map(GoalNotMet::from).collect(),
            },
            run::Outcome::Failed(error) => Outcome::Failed {
                error: RuntimeError::new(&error, &self.offsets),
            },
        };
        Some(outcome)
    }

    /// The calls in progress, as [`Run::calls`] gives them, before they cross to JavaScript.
    #[must_use]
    pub fn calls_in_progress(&self) -> Vec<Call> {
        let calls = self.core.machine().calls();
        calls.iter().map(Call::from).collect()
    }
}

#[wasm_bindgen]
impl Run {
    /// Runs one step, and gives what it showed outside the editor. A step may show an action
    /// and stop the program all the same (`if forward():` moves the robot, then stops on the
    /// value missing): the word tells the action, and [`Run::line`] that the program has
    /// stopped. Once it has, a step does nothing.
    pub fn step(&mut self) -> StepEvent {
        let (event, printed) = match self.core.step() {
            None => (StepEvent::Nothing, None),
            Some(Event::Printed(line)) => (StepEvent::Printed, Some(line)),
            Some(Event::Robot(action)) => (action.into(), None),
        };
        self.printed = printed;
        event
    }

    /// The line of the next step, from 1, which the editor highlights; nothing once the
    /// program has stopped, at its end or on an error, which [`Run::outcome`] then tells.
    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn line(&self) -> Option<u32> {
        match self.core.machine().state() {
            State::Running { line, .. } => Some(line.start.line),
            State::Ended | State::Failed(_) => None,
        }
    }

    /// Whether the next step goes on with its line after a call of that line has ended,
    /// rather than starts it. A breakpoint pauses the program when its line starts, never
    /// when it is highlighted again after a call.
    #[wasm_bindgen(getter, js_name = afterCall)]
    #[must_use]
    pub fn after_call(&self) -> bool {
        matches!(
            self.core.machine().state(),
            State::Running {
                after_call: true,
                ..
            }
        )
    }

    /// The number of steps run so far, the one that stopped the program on an error
    /// included: what the step counter of the status bar shows.
    #[wasm_bindgen(getter)]
    #[must_use]
    #[expect(
        clippy::cast_precision_loss,
        reason = "a number of JavaScript counts exactly up to 2^53 steps, centuries of a program \
                  that never ends"
    )]
    pub fn steps(&self) -> f64 {
        self.core.machine().steps() as f64
    }

    /// The line the last step printed, when [`Run::step`] gave `printed`; nothing after any
    /// other step.
    #[must_use]
    pub fn printed(&self) -> Option<String> {
        self.printed.clone()
    }

    /// The world as the program has changed it so far: the map to draw. It is built again
    /// at each call, and stays as it was once the program has stopped.
    ///
    /// # Errors
    ///
    /// It throws when the world can't be made a JavaScript object, which it never does.
    pub fn world(&self) -> Result<Ts<World>, JsError> {
        Ok(Ts::from_rust(&World::from(self.core.machine().world()))?)
    }

    /// How the run ended; nothing while the program runs. The goals of the map are checked
    /// on the world the program leaves, only when it ran to its end.
    ///
    /// # Errors
    ///
    /// It throws when the outcome can't be made a JavaScript object, which none of them does.
    pub fn outcome(&self) -> Result<Option<Ts<Outcome>>, JsError> {
        let outcome = self.ended();
        Ok(outcome.as_ref().map(Ts::from_rust).transpose()?)
    }

    /// The calls in progress, from the main program to the function being run, each with its
    /// line and its variables: what the variables panel shows. They stay as they were once
    /// the program has stopped.
    ///
    /// # Errors
    ///
    /// It throws when a call can't be made a JavaScript object, which none of them does.
    pub fn calls(&self) -> Result<Vec<Ts<Call>>, JsError> {
        self.calls_in_progress()
            .iter()
            .map(|call| Ok(Ts::from_rust(call)?))
            .collect()
    }
}

/// How a run ended.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum Outcome {
    /// The program ran to its end in the sandbox, which has no goal.
    Ended,
    /// The program ran to its end on a map of a level, every goal met: the map is passed.
    Passed,
    /// The program ran to its end on a map of a level, some goals not met.
    GoalsNotMet {
        /// The goals not met, at least one, in the order of the goals: where to stand, the
        /// paints, the cells painted in excess, the items, what the robot carries.
        goals: Vec<GoalNotMet>,
    },
    /// The program stopped on an error: the goals aren't checked.
    Failed {
        /// The error.
        error: RuntimeError,
    },
}

/// A goal not met at the end of a run, with its cell when it has one, where the map plants
/// its flag. Each variant is the one of the same name in the core (`GoalNotMet`), where it
/// is described.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum GoalNotMet {
    RobotNotAt { at: Point },
    PaintMissing { at: Point, color: Color },
    PaintedElsewhere { at: Point },
    ItemMissing { at: Point },
    NotCarrying,
    Carrying,
}

/// A call in progress: the main program, or a function that has been called and hasn't
/// ended.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
pub struct Call {
    /// The name of its function; none for the main program.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function: Option<String>,
    /// The line it is on, from 1. For the call being run: the line of the next step, or the
    /// last one run once the program has stopped. For the others: the line of the call they
    /// wait for.
    pub line: u32,
    /// Its variables alive, in the order they were declared, its parameters first.
    pub variables: Vec<Variable>,
}

/// A variable of a call in progress.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
pub struct Variable {
    /// Its name.
    pub name: String,
    /// Its value.
    pub value: Value,
    /// Whether the last step wrote it: declared it, with a `let` or as a parameter of the
    /// call entered, or gave it a value with `=`, even the value it had.
    pub changed: bool,
}

impl From<Action> for StepEvent {
    fn from(action: Action) -> Self {
        match action {
            Action::Moved => Self::Moved,
            Action::TurnedLeft => Self::TurnedLeft,
            Action::TurnedRight => Self::TurnedRight,
            Action::StartedPainting => Self::StartedPainting,
            Action::StoppedPainting => Self::StoppedPainting,
            Action::StartedErasing => Self::StartedErasing,
            Action::StoppedErasing => Self::StoppedErasing,
            Action::PickedUp => Self::PickedUp,
            Action::Dropped => Self::Dropped,
        }
    }
}

impl From<level::GoalNotMet> for GoalNotMet {
    fn from(goal: level::GoalNotMet) -> Self {
        match goal {
            level::GoalNotMet::RobotNotAt(at) => Self::RobotNotAt { at: at.into() },
            level::GoalNotMet::PaintMissing { at, color } => Self::PaintMissing {
                at: at.into(),
                color: color.into(),
            },
            level::GoalNotMet::PaintedElsewhere(at) => Self::PaintedElsewhere { at: at.into() },
            level::GoalNotMet::ItemMissing(at) => Self::ItemMissing { at: at.into() },
            level::GoalNotMet::NotCarrying => Self::NotCarrying,
            level::GoalNotMet::Carrying => Self::Carrying,
        }
    }
}

impl From<&CallInProgress<'_>> for Call {
    fn from(call: &CallInProgress<'_>) -> Self {
        let variables = call.variables.iter().map(|variable| Variable {
            name: variable.name.to_owned(),
            value: variable.value.into(),
            changed: variable.changed,
        });
        Self {
            function: call.function.map(str::to_owned),
            line: call.line.start.line,
            variables: variables.collect(),
        }
    }
}

#[cfg(test)]
mod tests {
    use stepwise_core::color;
    use stepwise_core::level::GoalNotMet as CoreGoal;
    use stepwise_core::world;

    use super::{Call, GoalNotMet, Outcome, Run, StartError, StepEvent, Variable};
    use crate::level::{Level, Sandbox};
    use crate::position::Span;
    use crate::runtime_error::{RuntimeError, RuntimeErrorKind};
    use crate::value::{Value, ValueType};
    use crate::world::{Color, Point};

    /// Two maps: a corridor with an item to bring to its end, then a shorter one to walk.
    const LEVEL: &str = r#"
version = 1
starting_code = ''

[[maps]]
terrain = '....'
robot = { at = [0, 0], facing = "east" }
items = [[1, 0]]

[maps.goals]
robot_at = [3, 0]
items_at = [[3, 0]]
carrying = false

[[maps]]
terrain = '..'
robot = { at = [0, 0], facing = "east" }

[maps.goals]
robot_at = [1, 0]
"#;

    const SANDBOX: &str = r#"
version = 1
starting_code = ''

[map]
terrain = '..'
robot = { at = [0, 0], facing = "east" }
"#;

    /// The most steps a program of these tests runs: they all end well before.
    const MAX_STEPS: usize = 100;

    /// The run of `source` on the map of index `map` of [`LEVEL`].
    #[track_caller]
    fn run_on(map: usize, source: &str) -> Run {
        let level = Level::new(LEVEL).expect("a valid level file");
        level.run(map, source).expect("a program that starts")
    }

    /// The run of `source` on the first map of [`LEVEL`].
    #[track_caller]
    fn run(source: &str) -> Run {
        run_on(0, source)
    }

    /// Runs `run` until it stops, and gives the event of each step.
    #[track_caller]
    fn finish(run: &mut Run) -> Vec<StepEvent> {
        let mut events = Vec::new();
        for _ in 0..MAX_STEPS {
            if run.line().is_none() {
                return events;
            }
            events.push(run.step());
        }
        panic!("the program still runs after {MAX_STEPS} steps");
    }

    fn number(text: &str) -> Value {
        Value {
            value_type: ValueType::Number,
            text: text.to_owned(),
        }
    }

    fn variable(name: &str, value: Value, changed: bool) -> Variable {
        Variable {
            name: name.to_owned(),
            value,
            changed,
        }
    }

    #[test]
    fn each_step_gives_what_it_showed_by_a_word() {
        let source = "\
let cells = 2
forward()
pick_up()
print(\"carrying\", is_carrying())
turn_left()
turn_right()
start_painting(red)
stop_painting()
start_erasing()
stop_erasing()
drop()
";
        let mut run = run(source);
        assert_eq!(
            finish(&mut run),
            [
                StepEvent::Nothing,
                StepEvent::Moved,
                StepEvent::PickedUp,
                StepEvent::Printed,
                StepEvent::TurnedLeft,
                StepEvent::TurnedRight,
                StepEvent::StartedPainting,
                StepEvent::StoppedPainting,
                StepEvent::StartedErasing,
                StepEvent::StoppedErasing,
                StepEvent::Dropped,
            ]
        );
    }

    #[test]
    fn the_line_printed_is_read_until_the_next_step() {
        let mut run = run("print(\"côté\", 3)\nforward()\nprint(true)\n");
        assert_eq!(run.printed(), None);
        assert_eq!(run.step(), StepEvent::Printed);
        // Read as often as asked, until another step runs.
        assert_eq!(run.printed().as_deref(), Some("côté 3"));
        assert_eq!(run.printed().as_deref(), Some("côté 3"));
        assert_eq!(run.step(), StepEvent::Moved);
        assert_eq!(run.printed(), None);
        assert_eq!(run.step(), StepEvent::Printed);
        assert_eq!(run.printed().as_deref(), Some("true"));
        // A step asked once the program has ended prints nothing.
        assert_eq!(run.step(), StepEvent::Nothing);
        assert_eq!(run.printed(), None);
    }

    #[test]
    fn the_line_of_the_next_step_is_given_until_the_program_stops() {
        let mut run = run("# Walk\n\nforward()\nif true:\n    forward()\n");
        let mut lines = Vec::new();
        while let Some(line) = run.line() {
            lines.push((line, run.steps()));
            run.step();
        }
        assert_eq!(lines, [(3, 0.0), (4, 1.0), (5, 2.0)]);
        assert_eq!(run.steps(), 3.0);
        // Nothing more runs, nor is counted.
        assert_eq!(run.step(), StepEvent::Nothing);
        assert_eq!((run.line(), run.steps()), (None, 3.0));
    }

    #[test]
    fn a_line_resumed_after_a_call_is_told_apart_from_a_line_that_starts() {
        let source = "\
function double(n):
    return n * 2

print(double(3))
";
        let mut run = run(source);
        let mut lines = Vec::new();
        while let Some(line) = run.line() {
            lines.push((line, run.after_call()));
            run.step();
        }
        // The line 4 starts, enters the function, and is highlighted again once it ends.
        assert_eq!(lines, [(4, false), (2, false), (4, true)]);
        assert!(!run.after_call());
    }

    #[test]
    fn a_program_that_meets_every_goal_passes_its_map() {
        let source = "forward()\npick_up()\nforward()\nforward()\ndrop()\n";
        let mut run = run(source);
        assert_eq!(run.ended(), None);
        finish(&mut run);
        assert_eq!(run.ended(), Some(Outcome::Passed));
    }

    #[test]
    fn the_goals_not_met_are_given_with_their_cells() {
        // The robot stops one cell short, the item still in its bay.
        let mut run = run("forward()\npick_up()\nforward()\n");
        finish(&mut run);
        let at = Point { x: 3, y: 0 };
        assert_eq!(
            run.ended(),
            Some(Outcome::GoalsNotMet {
                goals: vec![
                    GoalNotMet::RobotNotAt { at },
                    GoalNotMet::ItemMissing { at },
                    GoalNotMet::Carrying,
                ]
            })
        );
    }

    #[test]
    fn each_goal_not_met_of_the_core_keeps_its_name_and_its_cell() {
        let point = world::Point::new(2, 5);
        let at = Point { x: 2, y: 5 };
        let color = color::Color::Blue;
        for (core, expected) in [
            (CoreGoal::RobotNotAt(point), GoalNotMet::RobotNotAt { at }),
            (
                CoreGoal::PaintMissing { at: point, color },
                GoalNotMet::PaintMissing {
                    at,
                    color: Color::Blue,
                },
            ),
            (
                CoreGoal::PaintedElsewhere(point),
                GoalNotMet::PaintedElsewhere { at },
            ),
            (CoreGoal::ItemMissing(point), GoalNotMet::ItemMissing { at }),
            (CoreGoal::NotCarrying, GoalNotMet::NotCarrying),
            (CoreGoal::Carrying, GoalNotMet::Carrying),
        ] {
            assert_eq!(GoalNotMet::from(core), expected);
        }
    }

    #[test]
    fn a_step_can_show_an_action_and_stop_the_program() {
        let mut run = run("let side = \"côté 🤖\"\nif forward():\n    print(side)\n");
        assert_eq!(finish(&mut run), [StepEvent::Nothing, StepEvent::Moved]);
        // The place of the call, after the emoji of the line above: two units for JavaScript.
        let error = RuntimeError {
            span: Span {
                line: 2,
                from: 24,
                to: 33,
            },
            kind: RuntimeErrorKind::NoValue {
                function: "forward".to_owned(),
            },
        };
        assert_eq!(run.ended(), Some(Outcome::Failed { error }));
        assert_eq!(run.steps(), 2.0);
    }

    #[test]
    fn a_run_starts_on_the_map_asked() {
        // One step to the end of the second map, which is two cells long.
        let mut run = run_on(1, "forward()\n");
        finish(&mut run);
        assert_eq!(run.ended(), Some(Outcome::Passed));
    }

    #[test]
    fn a_run_in_the_sandbox_ends_without_goal() {
        let sandbox = Sandbox::new(SANDBOX).expect("a valid sandbox file");
        let mut run = sandbox.run("forward()\n").expect("a program that starts");
        assert_eq!(finish(&mut run), [StepEvent::Moved]);
        assert_eq!(run.ended(), Some(Outcome::Ended));
    }

    #[test]
    fn a_program_with_errors_or_a_map_that_is_not_there_starts_nothing() {
        let level = Level::new(LEVEL).expect("a valid level file");
        for refused in ["forward(\n", "forwrad()\n"] {
            let error = level.run(0, refused).expect_err("a program refused");
            assert_eq!(error, StartError::ProgramRefused, "in {refused:?}");
        }
        let error = level.run(2, "forward()\n").expect_err("no third map");
        assert_eq!(error, StartError::NoSuchMap { index: 2, maps: 2 });
        assert_eq!(error.to_string(), "the level has no map 2: it has 2");
        let sandbox = Sandbox::new(SANDBOX).expect("a valid sandbox file");
        let error = sandbox.run("forwrad()\n").expect_err("a program refused");
        assert_eq!(
            error.to_string(),
            "the program has errors: check it before starting it"
        );
    }

    #[test]
    fn the_calls_in_progress_give_their_lines_and_their_variables() {
        let source = "\
function paint_side(length):
    let done = 0
    done = done + 1

let sides = 4
paint_side(3)
";
        let mut run = run(source);
        // Up to the line 3: the `let` of the function has just run.
        while run.line() != Some(3) {
            run.step();
        }
        assert_eq!(
            run.calls_in_progress(),
            [
                Call {
                    function: None,
                    line: 6,
                    variables: vec![variable("sides", number("4"), false)],
                },
                Call {
                    function: Some("paint_side".to_owned()),
                    line: 3,
                    variables: vec![
                        variable("length", number("3"), false),
                        variable("done", number("0"), true),
                    ],
                },
            ]
        );
    }

    #[test]
    fn the_calls_stay_as_they_were_once_the_program_has_stopped() {
        let mut run = run("let side = \"north\"\nprint(1 / 0)\n");
        finish(&mut run);
        let text = Value {
            value_type: ValueType::Text,
            text: "north".to_owned(),
        };
        assert_eq!(
            run.calls_in_progress(),
            [Call {
                function: None,
                line: 2,
                variables: vec![variable("side", text, false)],
            }]
        );
    }
}
