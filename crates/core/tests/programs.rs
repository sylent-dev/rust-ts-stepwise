//! Whole programs run on the maps of levels, through the public API alone and in the order
//! the website will follow: the level file read, the program checked, run one step at a time
//! to its end, then the goals of the map checked on the world the program leaves.
//!
//! The levels of the website come with the steps of their chapters: the ones of
//! `trial-levels/` are for these tests only.

use stepwise_core::color::Color;
use stepwise_core::interpreter::{Action, Event, RuntimeErrorKind, State};
use stepwise_core::level::{GoalNotMet, Level};
use stepwise_core::program::{Checked, check};
use stepwise_core::run::{Outcome, Run};
use stepwise_core::world::{Point, RobotError};

const PAINT_A_SQUARE: &str = include_str!("trial-levels/paint-a-square.toml");
const CARRY_THE_ITEM: &str = include_str!("trial-levels/carry-the-item.toml");
const TURN_THE_CORNER: &str = include_str!("trial-levels/turn-the-corner.toml");

/// The most steps a program of these tests runs: they all end well before.
const MAX_STEPS: usize = 1000;

/// How a program ends on a map: the outcome of its run, an error told by its kind and its
/// line alone.
#[derive(Debug, PartialEq, Eq)]
enum End {
    /// It ended, every goal met: the map is passed.
    Passed,
    /// It ended with these goals not met.
    GoalsNotMet(Vec<GoalNotMet>),
    /// It stopped on this error, on this line: the goals aren't checked.
    Stopped(RuntimeErrorKind, u32),
}

/// The checked program of `source`, which must have no error.
#[track_caller]
fn checked(source: &str) -> Checked {
    match check(source) {
        Ok(checked) => checked,
        Err(refused) => panic!("{refused:?} in {source:?}"),
    }
}

/// Runs `source` on each map of `level`, a level file, and says how it ends on each.
#[track_caller]
fn run(level: &str, source: &str) -> Vec<End> {
    let level = Level::from_toml(level).expect("a valid level file");
    let program = checked(source);
    let ends = level.maps().iter().map(|map| {
        // Each map starts from its own world, which the level keeps as it is.
        let mut run = Run::on_map(&program, map);
        for _ in 0..MAX_STEPS {
            if run.outcome().is_some() {
                break;
            }
            run.step();
        }
        match run.outcome() {
            Some(Outcome::Passed) => End::Passed,
            Some(Outcome::GoalsNotMet(not_met)) => End::GoalsNotMet(not_met),
            Some(Outcome::Failed(error)) => End::Stopped(error.kind, error.span.start.line),
            Some(Outcome::Ended) => panic!("a map of a level has goals"),
            None => panic!("{source:?} still runs after {MAX_STEPS} steps"),
        }
    });
    ends.collect()
}

fn stopped(error: RobotError, line: u32) -> End {
    End::Stopped(RuntimeErrorKind::Robot(error), line)
}

fn red_missing(x: u8, y: u8) -> GoalNotMet {
    GoalNotMet::PaintMissing {
        at: Point::new(x, y),
        color: Color::Red,
    }
}

#[test]
fn the_starting_code_of_the_trial_levels_is_checked() {
    for source in [PAINT_A_SQUARE, CARRY_THE_ITEM, TURN_THE_CORNER] {
        let level = Level::from_toml(source).expect("a valid level file");
        check(level.starting_code()).expect("a starting code without error");
        assert_eq!(level.maps().len(), 2);
    }
}

// The events: what the interface reads at each step.

#[test]
fn each_step_gives_what_the_learner_sees_of_it() {
    let level = Level::from_toml(CARRY_THE_ITEM).expect("a valid level file");
    let map = level.maps().first().expect("a first map");
    let source = "forward()\nforward()\npick_up()\nprint(is_carrying())\nturn_left()\ndrop()\n";
    let mut run = Run::on_map(&checked(source), map);
    let mut events = Vec::new();
    for _ in 0..MAX_STEPS {
        if run.outcome().is_some() {
            break;
        }
        // A step gives one event or none.
        events.extend(run.step());
    }
    // The program ran to its end: it isn't one that solves the level.
    assert_eq!(*run.machine().state(), State::Ended);
    assert_eq!(
        events,
        [
            Event::Robot(Action::Moved),
            Event::Robot(Action::Moved),
            Event::Robot(Action::PickedUp),
            Event::Printed("true".to_owned()),
            Event::Robot(Action::TurnedLeft),
            Event::Robot(Action::Dropped),
        ]
    );
}

// Paint: the brush, the functions of the program, the goals of paint.

/// The example that opens *The language* in `specs.md`, as it is written there.
const SQUARE_OF_THE_SPECIFICATIONS: &str = "\
# Paint a square of side 3
function paint_side(length):
    start_painting(red)
    repeat length:
        forward()
    stop_painting()

let sides = 0
while sides < 4:
    paint_side(3)
    turn_right()
    sides = sides + 1

if front_is_clear():
    forward()
else if left_is_clear():
    turn_left()
else:
    print(\"I am stuck\")
";

#[test]
fn the_example_of_the_specifications_paints_its_square_on_each_map() {
    assert_eq!(
        run(PAINT_A_SQUARE, SQUARE_OF_THE_SPECIFICATIONS),
        [End::Passed, End::Passed]
    );
}

#[test]
fn a_square_with_a_side_missing_leaves_its_cells_as_goals_not_met() {
    let source = "\
function paint_side(length):
    start_painting(red)
    repeat length:
        forward()
    stop_painting()

repeat 3:
    paint_side(3)
    turn_right()
";
    // The corners of the fourth side are painted by the sides next to it.
    assert_eq!(
        run(PAINT_A_SQUARE, source),
        [
            End::GoalsNotMet(vec![red_missing(1, 3), red_missing(1, 2)]),
            End::GoalsNotMet(vec![red_missing(2, 0), red_missing(3, 0)]),
        ]
    );
}

#[test]
fn a_square_in_another_color_meets_no_goal_of_paint() {
    let source = SQUARE_OF_THE_SPECIFICATIONS.replace("red", "blue");
    let ends = run(PAINT_A_SQUARE, &source);
    for end in &ends {
        let End::GoalsNotMet(not_met) = end else {
            panic!("the goals should not be met: {end:?}");
        };
        // The twelve cells of the square, each painted in blue.
        assert_eq!(not_met.len(), 12, "{not_met:?}");
        assert!(
            not_met
                .iter()
                .all(|goal| matches!(goal, GoalNotMet::PaintMissing { .. }))
        );
    }
    assert_eq!(ends.len(), 2);
}

#[test]
fn a_side_too_long_bumps_into_the_edge_and_the_goals_are_not_checked() {
    let source = SQUARE_OF_THE_SPECIFICATIONS.replace("paint_side(3)", "paint_side(4)");
    // The line 5 is the `forward()` of the function.
    assert_eq!(
        run(PAINT_A_SQUARE, &source),
        [stopped(RobotError::Bump, 5), stopped(RobotError::Bump, 5)]
    );
}

// Carry: the items, the loops on a sensor, the goals of items.

#[test]
fn a_program_that_looks_for_the_item_brings_it_to_its_slot_on_each_map() {
    let source = "\
while not item_here():
    forward()
pick_up()
while front_is_clear():
    forward()
drop()
";
    assert_eq!(run(CARRY_THE_ITEM, source), [End::Passed, End::Passed]);
}

#[test]
fn a_program_that_counts_the_cells_of_one_map_does_not_pass_the_other() {
    let source = "\
repeat 2:
    forward()
pick_up()
repeat 4:
    forward()
drop()
";
    assert_eq!(
        run(CARRY_THE_ITEM, source),
        [End::Passed, stopped(RobotError::NoItemHere, 3)]
    );
}

#[test]
fn an_item_that_is_not_dropped_leaves_two_goals_not_met() {
    let source = "\
while not item_here():
    forward()
pick_up()
while front_is_clear():
    forward()
";
    let not_met = || {
        End::GoalsNotMet(vec![
            GoalNotMet::ItemMissing(Point::new(7, 1)),
            GoalNotMet::Carrying,
        ])
    };
    assert_eq!(run(CARRY_THE_ITEM, source), [not_met(), not_met()]);
}

// Decide: the sensors, `if` and `else`, the goal of where to stand.

#[test]
fn a_program_that_senses_the_walls_follows_the_corridor_on_each_map() {
    let source = "\
while front_is_clear():
    forward()
if left_is_clear():
    turn_left()
else:
    turn_right()
while front_is_clear():
    forward()
";
    assert_eq!(run(TURN_THE_CORNER, source), [End::Passed, End::Passed]);
}

#[test]
fn a_program_that_always_turns_right_stays_at_the_corner_of_the_other_map() {
    let source = "\
while front_is_clear():
    forward()
turn_right()
while front_is_clear():
    forward()
";
    let at_the_corner = End::GoalsNotMet(vec![GoalNotMet::RobotNotAt(Point::new(3, 0))]);
    assert_eq!(run(TURN_THE_CORNER, source), [End::Passed, at_the_corner]);
}

#[test]
fn an_empty_program_passes_no_map() {
    for level in [PAINT_A_SQUARE, CARRY_THE_ITEM, TURN_THE_CORNER] {
        for end in run(level, "# Nothing yet\n") {
            assert!(matches!(end, End::GoalsNotMet(_)), "{end:?}");
        }
    }
}
