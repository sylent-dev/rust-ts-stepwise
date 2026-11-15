//! A run: a checked program run one step at a time on a map of a level, or in the sandbox,
//! and how it ends (see *Running a program* and the goals of *Levels and progression* in
//! `specs.md`).
//!
//! The machine runs the program and knows nothing of the goals; the goals look at a world
//! and know nothing of the program. A [`Run`] holds both for one map, so that the goals
//! checked at the end are those of the world the program ran on.

use crate::interpreter::{Event, Machine, RuntimeError, State};
use crate::level::{GoalNotMet, Goals, LevelMap, Sandbox};
use crate::program::Checked;

/// A program being run on a map of a level, or in the sandbox.
#[derive(Debug)]
pub struct Run {
    machine: Machine,
    /// The goals of the map, `None` in the sandbox, which has none.
    goals: Option<Goals>,
}

/// How a run ended.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Outcome {
    /// The program ran to its end in the sandbox, which has no goal.
    Ended,
    /// The program ran to its end on a map of a level, every goal met: the map is passed.
    Passed,
    /// The program ran to its end on a map of a level with these goals not met, at least
    /// one, in the order [`Goals::check`] gives them.
    GoalsNotMet(Vec<GoalNotMet>),
    /// The program stopped on this error: the goals aren't checked, and the map isn't
    /// passed, even when the world meets them.
    Failed(RuntimeError),
}

impl Run {
    /// A run of `program` on `map`, paused before its first line. The map stays as it
    /// starts: the program changes a copy of its world, and running it again takes a new
    /// run.
    #[must_use]
    pub fn on_map(program: &Checked, map: &LevelMap) -> Self {
        Self {
            machine: Machine::new(program, map.world().clone()),
            goals: Some(map.goals().clone()),
        }
    }

    /// A run of `program` in `sandbox`, paused before its first line. The sandbox stays as
    /// it starts, as a map of a level.
    #[must_use]
    pub fn in_sandbox(program: &Checked, sandbox: &Sandbox) -> Self {
        Self {
            machine: Machine::new(program, sandbox.world().clone()),
            goals: None,
        }
    }

    /// The machine that runs the program: where it is, its world, its calls in progress and
    /// the steps it has run.
    #[must_use]
    pub const fn machine(&self) -> &Machine {
        &self.machine
    }

    /// Runs one step, and gives what the learner sees of it (see [`Machine::step`]). Once
    /// the run has ended, nothing happens anymore.
    pub fn step(&mut self) -> Option<Event> {
        self.machine.step()
    }

    /// How the run ended, `None` while the program runs. The goals are checked on the world
    /// the program leaves, and only when it ran to its end.
    #[must_use]
    pub fn outcome(&self) -> Option<Outcome> {
        match self.machine.state() {
            State::Running { .. } => None,
            State::Failed(error) => Some(Outcome::Failed(error.clone())),
            State::Ended => Some(match &self.goals {
                None => Outcome::Ended,
                Some(goals) => {
                    let not_met = goals.check(self.machine.world());
                    if not_met.is_empty() {
                        Outcome::Passed
                    } else {
                        Outcome::GoalsNotMet(not_met)
                    }
                }
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Outcome, Run};
    use crate::interpreter::{Action, Event, RuntimeError, RuntimeErrorKind};
    use crate::level::{GoalNotMet, Level, Sandbox};
    use crate::program::{Checked, check};
    use crate::test_support::span;
    use crate::world::{Point, RobotError};

    /// A corridor of three cells, to walk to its end.
    const LEVEL: &str = r#"
version = 1
starting_code = ''

[[maps]]
terrain = '...'
robot = { at = [0, 0], facing = "east" }

[maps.goals]
robot_at = [2, 0]
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

    #[track_caller]
    fn level() -> Level {
        Level::from_toml(LEVEL).expect("a valid level file")
    }

    #[track_caller]
    fn checked(source: &str) -> Checked {
        check(source).expect("a program without error")
    }

    /// Runs `run` to its end, and gives how it ended with the number of steps it took.
    #[track_caller]
    fn finish(mut run: Run) -> (Outcome, u64) {
        for _ in 0..MAX_STEPS {
            if let Some(outcome) = run.outcome() {
                return (outcome, run.machine().steps());
            }
            run.step();
        }
        panic!("the program still runs after {MAX_STEPS} steps");
    }

    /// How `source` ends on the map of [`LEVEL`].
    #[track_caller]
    fn outcome_on_the_map(source: &str) -> Outcome {
        finish(Run::on_map(&checked(source), &level().maps()[0])).0
    }

    #[test]
    fn a_program_that_meets_every_goal_passes_the_map() {
        let level = level();
        let mut run = Run::on_map(&checked("forward()\nforward()\n"), &level.maps()[0]);
        // No outcome while the program runs, even on the step before its last.
        assert_eq!(run.outcome(), None);
        assert_eq!(run.step(), Some(Event::Robot(Action::Moved)));
        assert_eq!(run.outcome(), None);
        assert_eq!(run.step(), Some(Event::Robot(Action::Moved)));
        assert_eq!(run.outcome(), Some(Outcome::Passed));
    }

    #[test]
    fn a_program_that_ends_elsewhere_leaves_its_goals_not_met() {
        let not_met = vec![GoalNotMet::RobotNotAt(Point::new(2, 0))];
        assert_eq!(
            outcome_on_the_map("forward()\n"),
            Outcome::GoalsNotMet(not_met)
        );
    }

    #[test]
    fn a_program_that_stops_on_an_error_is_not_passed_even_on_the_cell_of_the_goal() {
        // The robot stands on the cell of the goal when it bumps into the edge of the map.
        let error = RuntimeError {
            kind: RuntimeErrorKind::Robot(RobotError::Bump),
            span: span(3, 1, 10),
        };
        assert_eq!(
            outcome_on_the_map("forward()\nforward()\nforward()\n"),
            Outcome::Failed(error)
        );
    }

    #[test]
    fn an_empty_program_ends_before_any_step_with_its_goals_not_met() {
        let level = level();
        let run = Run::on_map(&checked("# Nothing yet\n"), &level.maps()[0]);
        let not_met = vec![GoalNotMet::RobotNotAt(Point::new(2, 0))];
        assert_eq!(finish(run), (Outcome::GoalsNotMet(not_met), 0));
    }

    #[test]
    fn a_program_ends_in_the_sandbox_without_any_goal() {
        let sandbox = Sandbox::from_toml(SANDBOX).expect("a valid sandbox file");
        let run = Run::in_sandbox(&checked("forward()\n"), &sandbox);
        assert_eq!(finish(run), (Outcome::Ended, 1));
        // An error stops it there as on a map.
        let run = Run::in_sandbox(&checked("forward()\nforward()\n"), &sandbox);
        let (outcome, steps) = finish(run);
        assert!(matches!(outcome, Outcome::Failed(_)), "{outcome:?}");
        assert_eq!(steps, 2);
    }

    #[test]
    fn a_step_after_the_end_changes_nothing() {
        let level = level();
        let mut run = Run::on_map(&checked("forward()\nforward()\n"), &level.maps()[0]);
        run.step();
        run.step();
        for _ in 0..3 {
            assert_eq!(run.step(), None);
            assert_eq!(run.outcome(), Some(Outcome::Passed));
            assert_eq!(run.machine().steps(), 2);
        }
    }

    #[test]
    fn the_map_stays_as_it_starts_for_the_next_run() {
        let level = level();
        let map = &level.maps()[0];
        let program = checked("forward()\nforward()\n");
        let (first, _) = finish(Run::on_map(&program, map));
        assert_eq!(map.world().robot().position(), Point::new(0, 0));
        // The same program passes again: it starts from the same cell.
        let (second, _) = finish(Run::on_map(&program, map));
        assert_eq!((first, second), (Outcome::Passed, Outcome::Passed));
    }
}
