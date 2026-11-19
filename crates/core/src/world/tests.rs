//! The tests of the world, grouped by the rules of *Map* and *Built-in functions* in
//! `specs.md`.

use super::{
    BuildError, Cell, Direction, MAX_COLUMNS, MAX_ROWS, Map, Point, Robot, RobotError, Side, Tool,
    World,
};
use std::collections::HashSet;

use crate::color::Color;
use crate::test_support::{Random, paints, world};

/// The painted passages of the map, each once, from the cell on its west or its north.
fn passages(world: &World) -> Vec<(Point, Direction)> {
    let map = world.map();
    let mut passages = Vec::new();
    for y in 0..map.height() {
        for x in 0..map.width() {
            for direction in [Direction::East, Direction::South] {
                if map.passage(Point::new(x, y), direction) {
                    passages.push((Point::new(x, y), direction));
                }
            }
        }
    }
    passages
}

fn east(x: u8, y: u8) -> (Point, Direction) {
    (Point::new(x, y), Direction::East)
}

fn south(x: u8, y: u8) -> (Point, Direction) {
    (Point::new(x, y), Direction::South)
}

mod map {
    use super::*;

    #[test]
    fn a_map_has_one_to_sixteen_columns_and_one_to_twelve_rows() {
        assert!(Map::new(1, 1).is_ok());
        assert!(Map::new(MAX_COLUMNS.into(), MAX_ROWS.into()).is_ok());
        for (width, height) in [(0, 1), (1, 0), (17, 1), (1, 13), (300, 1), (1, 300)] {
            assert_eq!(
                Map::new(width, height),
                Err(BuildError::Size { width, height })
            );
        }
    }

    #[test]
    fn outside_the_map_counts_as_a_wall() {
        let map = Map::new(2, 2).unwrap();
        for point in [Point::new(2, 0), Point::new(0, 2), Point::new(255, 255)] {
            assert_eq!(map.cell(point), None);
            assert!(!map.is_floor(point));
            assert_eq!(map.paint(point), None);
            assert!(!map.has_item(point));
        }
    }

    #[test]
    fn nothing_lies_on_a_wall() {
        let mut map = Map::new(3, 1).unwrap();
        let wall = Point::new(1, 0);
        map.set_wall(wall).unwrap();
        assert_eq!(
            map.set_paint(wall, Color::Red),
            Err(BuildError::OnWall(wall))
        );
        assert_eq!(map.set_item(wall), Err(BuildError::OnWall(wall)));
        let outside = Point::new(3, 0);
        assert_eq!(map.set_wall(outside), Err(BuildError::OutsideMap(outside)));
        assert_eq!(map.set_item(outside), Err(BuildError::OutsideMap(outside)));
    }

    #[test]
    fn a_passage_is_painted_only_between_two_painted_neighbors() {
        let mut map = Map::new(3, 2).unwrap();
        let [a, b, c] = [Point::new(0, 0), Point::new(1, 0), Point::new(1, 1)];
        assert_eq!(map.set_passage(a, c), Err(BuildError::NotNeighbors(a, c)));
        map.set_paint(a, Color::Red).unwrap();
        assert_eq!(map.set_passage(a, b), Err(BuildError::Unpainted(b)));
        map.set_paint(b, Color::Blue).unwrap();
        map.set_passage(b, a).unwrap();
        assert!(map.passage(a, Direction::East));
        assert!(map.passage(b, Direction::West));
        assert!(!map.passage(b, Direction::East));
        map.set_paint(c, Color::Red).unwrap();
        let outside = Point::new(1, 2);
        assert_eq!(
            map.set_passage(c, outside),
            Err(BuildError::OutsideMap(outside))
        );
        assert_eq!(map.set_passage(c, c), Err(BuildError::NotNeighbors(c, c)));
        let wall = Point::new(2, 1);
        map.set_wall(wall).unwrap();
        assert_eq!(map.set_passage(c, wall), Err(BuildError::OnWall(wall)));
    }

    #[test]
    fn a_wall_is_set_on_a_cell_without_paint_nor_item() {
        let mut map = Map::new(3, 1).unwrap();
        let [painted, item, empty] = [Point::new(0, 0), Point::new(1, 0), Point::new(2, 0)];
        map.set_paint(painted, Color::Yellow).unwrap();
        map.set_item(item).unwrap();
        assert_eq!(map.set_wall(painted), Err(BuildError::NotEmpty(painted)));
        assert_eq!(map.set_wall(item), Err(BuildError::NotEmpty(item)));
        assert_eq!(map.paint(painted), Some(Color::Yellow));
        assert!(map.has_item(item));
        map.set_wall(empty).unwrap();
        map.set_wall(empty).unwrap();
        assert_eq!(map.cell(empty), Some(Cell::Wall));
    }

    #[test]
    fn the_robot_stands_on_a_floor_cell_of_the_map() {
        let map = world(&["#>"]).map().clone();
        let wall = Point::new(0, 0);
        let robot = Robot::new(wall, Direction::East);
        assert_eq!(
            World::new(map.clone(), robot),
            Err(BuildError::OnWall(wall))
        );
        let outside = Point::new(2, 0);
        let robot = Robot::new(outside, Direction::East);
        assert_eq!(World::new(map, robot), Err(BuildError::OutsideMap(outside)));
    }

    #[test]
    fn the_robot_starts_with_its_brush_and_its_eraser_up() {
        let world = world(&[">"]);
        assert_eq!(world.robot().tool(), None);
        assert!(!world.is_painting());
        assert!(!world.is_erasing());
        assert!(!world.is_carrying());
    }
}

mod moving {
    use super::*;

    #[test]
    fn forward_moves_one_cell_in_front() {
        let mut world = world(&["...", ".^.", "..."]);
        world.forward().unwrap();
        assert_eq!(world.robot().position(), Point::new(1, 0));
        assert_eq!(world.robot().direction(), Direction::North);
    }

    #[test]
    fn the_robot_bumps_into_a_wall_and_does_not_move() {
        let mut world = world(&[">#"]);
        world.start_painting(Color::Red);
        assert_eq!(world.forward(), Err(RobotError::Bump));
        assert_eq!(world.robot().position(), Point::new(0, 0));
        assert_eq!(paints(&world), ["r#"]);
        assert_eq!(passages(&world), []);
    }

    #[test]
    fn the_robot_bumps_into_each_edge_of_the_map() {
        for start in ["^", ">", "v", "<"] {
            let mut world = world(&[start]);
            assert_eq!(world.forward(), Err(RobotError::Bump), "facing {start}");
        }
    }

    #[test]
    fn the_robot_goes_over_an_item() {
        let mut world = world(&[">o."]);
        world.forward().unwrap();
        assert!(world.item_here());
        world.forward().unwrap();
        assert!(world.map().has_item(Point::new(1, 0)));
    }

    #[test]
    fn turning_is_a_quarter_turn_on_its_cell() {
        use Direction::{East, North, South, West};
        let mut world = world(&["^"]);
        let mut left = Vec::new();
        for _ in 0..4 {
            world.turn_left();
            left.push(world.robot().direction());
        }
        assert_eq!(left, [West, South, East, North]);
        world.turn_right();
        assert_eq!(world.robot().direction(), East);
        assert_eq!(world.robot().position(), Point::new(0, 0));
    }
}

mod painting {
    use super::*;

    #[test]
    fn the_brush_paints_its_cell_at_once_without_passage() {
        let mut world = world(&[">.."]);
        world.start_painting(Color::Blue);
        assert!(world.is_painting());
        assert_eq!(world.robot().tool(), Some(Tool::Brush(Color::Blue)));
        assert_eq!(paints(&world), ["b.."]);
        assert_eq!(passages(&world), []);
    }

    #[test]
    fn the_brush_paints_every_cell_it_moves_into_and_the_passages_it_crosses() {
        let mut world = world(&[">..", "..."]);
        world.start_painting(Color::Red);
        world.forward().unwrap();
        world.turn_right();
        world.forward().unwrap();
        assert_eq!(paints(&world), ["rr.", ".r."]);
        assert_eq!(passages(&world), [east(0, 0), south(1, 0)]);
    }

    #[test]
    fn turning_paints_nothing_more() {
        let mut world = world(&[".>."]);
        world.start_painting(Color::Red);
        for _ in 0..4 {
            world.turn_left();
        }
        assert_eq!(paints(&world), [".r."]);
        assert_eq!(passages(&world), []);
    }

    #[test]
    fn the_brush_paints_over_any_paint_and_keeps_the_passages() {
        let mut world = world(&[">yb.."]);
        world.start_painting(Color::Red);
        world.forward().unwrap();
        world.start_painting(Color::Blue);
        world.forward().unwrap();
        world.forward().unwrap();
        // Each half of a passage is drawn in the color of its cell (decided on 2026-11-12):
        // the passage between the red and the blue cells stays.
        assert_eq!(paints(&world), ["rbbb."]);
        assert_eq!(passages(&world), [east(0, 0), east(1, 0), east(2, 0)]);
    }

    #[test]
    fn stop_painting_lifts_the_brush() {
        let mut world = world(&[">.."]);
        world.start_painting(Color::Yellow);
        world.stop_painting();
        assert!(!world.is_painting());
        world.forward().unwrap();
        assert_eq!(paints(&world), ["y.."]);
        world.stop_painting();
        assert_eq!(world.robot().tool(), None);
    }

    #[test]
    fn stop_painting_leaves_the_eraser_down() {
        let mut world = world(&[">"]);
        world.start_erasing();
        world.stop_painting();
        assert!(world.is_erasing());
    }

    #[test]
    fn putting_the_brush_down_lifts_the_eraser() {
        let mut world = world(&[">."]);
        world.start_erasing();
        world.start_painting(Color::Blue);
        assert!(world.is_painting());
        assert!(!world.is_erasing());
    }
}

mod erasing {
    use super::*;

    /// A red stroke along the top row and down the middle column, painted by the robot,
    /// which ends on the left of the top row facing east, its brush up.
    fn painted() -> World {
        let mut world = world(&[">..", "...", "..."]);
        world.start_painting(Color::Red);
        world.forward().unwrap();
        world.forward().unwrap();
        world.turn_left();
        world.turn_left();
        world.forward().unwrap();
        world.turn_left();
        world.forward().unwrap();
        world.forward().unwrap();
        world.stop_painting();
        world.turn_left();
        world.turn_left();
        world.forward().unwrap();
        world.forward().unwrap();
        world.turn_left();
        world.forward().unwrap();
        world.turn_left();
        world.turn_left();
        assert_eq!(paints(&world), ["rrr", ".r.", ".r."]);
        assert_eq!(
            passages(&world),
            [east(0, 0), east(1, 0), south(1, 0), south(1, 1)]
        );
        assert_eq!(world.robot().position(), Point::new(0, 0));
        assert_eq!(world.robot().direction(), Direction::East);
        world
    }

    #[test]
    fn the_eraser_removes_the_paint_of_its_cell_at_once_and_keeps_its_passages() {
        let mut world = painted();
        world.forward().unwrap();
        world.start_erasing();
        assert!(world.is_erasing());
        assert_eq!(world.robot().tool(), Some(Tool::Eraser));
        assert_eq!(paints(&world), ["r.r", ".r.", ".r."]);
        assert_eq!(
            passages(&world),
            [east(0, 0), east(1, 0), south(1, 0), south(1, 1)]
        );
    }

    #[test]
    fn the_eraser_removes_the_paint_of_every_cell_it_moves_into_and_of_the_passage_it_crosses() {
        let mut world = painted();
        world.start_erasing();
        world.forward().unwrap();
        assert_eq!(paints(&world), ["..r", ".r.", ".r."]);
        // The passages ahead of the robot keep their paint until it crosses them.
        assert_eq!(passages(&world), [east(1, 0), south(1, 0), south(1, 1)]);
        world.forward().unwrap();
        assert_eq!(paints(&world), ["...", ".r.", ".r."]);
        assert_eq!(passages(&world), [south(1, 0), south(1, 1)]);
    }

    #[test]
    fn a_cell_erased_alone_joins_its_stroke_again_when_it_is_painted_again() {
        let mut world = painted();
        world.forward().unwrap();
        world.start_erasing();
        world.start_painting(Color::Blue);
        assert_eq!(paints(&world), ["rbr", ".r.", ".r."]);
        assert_eq!(
            passages(&world),
            [east(0, 0), east(1, 0), south(1, 0), south(1, 1)]
        );
    }

    #[test]
    fn a_passage_loses_its_paint_once_neither_of_its_cells_is_painted() {
        let mut world = painted();
        world.forward().unwrap();
        world.start_erasing();
        world.stop_erasing();
        world.forward().unwrap();
        world.start_erasing();
        assert_eq!(paints(&world), ["r..", ".r.", ".r."]);
        assert_eq!(passages(&world), [east(0, 0), south(1, 0), south(1, 1)]);
        // Painted again, the cell has no stroke toward its neighbor without paint.
        world.start_painting(Color::Blue);
        assert_eq!(paints(&world), ["r.b", ".r.", ".r."]);
        assert_eq!(passages(&world), [east(0, 0), south(1, 0), south(1, 1)]);
    }

    #[test]
    fn a_cell_erased_alone_then_turned_into_a_wall_loses_its_passages() {
        let mut world = painted();
        world.forward().unwrap();
        world.start_erasing();
        let mut map = world.map().clone();
        map.set_wall(Point::new(1, 0)).unwrap();
        for direction in Direction::ALL {
            assert!(!map.passage(Point::new(1, 0), direction));
        }
        assert!(map.passage(Point::new(1, 1), Direction::South));
    }

    #[test]
    fn the_eraser_bumps_into_a_wall_and_erases_nothing_more() {
        let mut world = world(&["r>#"]);
        world.start_erasing();
        assert_eq!(world.forward(), Err(RobotError::Bump));
        assert_eq!(world.robot().position(), Point::new(1, 0));
        assert!(world.is_erasing());
        assert_eq!(paints(&world), ["r.#"]);
    }

    #[test]
    fn an_unpainted_cell_stays_unpainted() {
        let mut world = world(&[">."]);
        world.start_erasing();
        world.forward().unwrap();
        assert_eq!(paints(&world), [".."]);
    }

    #[test]
    fn stop_erasing_lifts_the_eraser_and_leaves_the_brush_down() {
        let mut world = world(&[">r"]);
        world.start_erasing();
        world.stop_erasing();
        assert_eq!(world.robot().tool(), None);
        world.forward().unwrap();
        assert_eq!(paints(&world), [".r"]);
        world.start_painting(Color::Blue);
        world.stop_erasing();
        assert!(world.is_painting());
    }

    #[test]
    fn putting_the_eraser_down_lifts_the_brush() {
        let mut world = world(&[">."]);
        world.start_painting(Color::Red);
        world.start_erasing();
        assert!(!world.is_painting());
        assert_eq!(paints(&world), [".."]);
    }
}

mod carrying {
    use super::*;

    #[test]
    fn pick_up_takes_the_item_of_its_cell() {
        let mut world = world(&[">o"]);
        world.forward().unwrap();
        world.pick_up().unwrap();
        assert!(world.is_carrying());
        assert!(!world.item_here());
    }

    #[test]
    fn pick_up_without_item_is_an_error() {
        let mut world = world(&[">"]);
        assert_eq!(world.pick_up(), Err(RobotError::NoItemHere));
        assert!(!world.is_carrying());
    }

    #[test]
    fn pick_up_while_carrying_is_an_error_and_leaves_the_item() {
        let map = world(&[">o"]).map().clone();
        let robot = Robot::new(Point::new(1, 0), Direction::East).with_item();
        let mut world = World::new(map, robot).unwrap();
        assert_eq!(world.pick_up(), Err(RobotError::AlreadyCarrying));
        assert!(world.item_here());
    }

    #[test]
    fn pick_up_called_twice_says_the_robot_already_carries_an_item() {
        let mut world = world(&[">o"]);
        world.forward().unwrap();
        world.pick_up().unwrap();
        assert_eq!(world.pick_up(), Err(RobotError::AlreadyCarrying));
    }

    #[test]
    fn drop_puts_the_item_it_carries_on_its_cell() {
        let mut world = world(&["o>."]);
        world.turn_left();
        world.turn_left();
        world.forward().unwrap();
        world.pick_up().unwrap();
        world.turn_left();
        world.turn_left();
        world.forward().unwrap();
        world.forward().unwrap();
        world.drop_item().unwrap();
        assert!(!world.is_carrying());
        assert!(world.item_here());
        assert!(!world.map().has_item(Point::new(0, 0)));
    }

    #[test]
    fn drop_without_item_is_an_error() {
        let mut world = world(&[">"]);
        assert_eq!(world.drop_item(), Err(RobotError::NotCarrying));
    }

    #[test]
    fn drop_on_an_item_is_an_error_and_keeps_the_item_carried() {
        let map = world(&[">o"]).map().clone();
        let robot = Robot::new(Point::new(1, 0), Direction::East).with_item();
        let mut world = World::new(map, robot).unwrap();
        assert_eq!(world.drop_item(), Err(RobotError::ItemAlreadyHere));
        assert!(world.is_carrying());
    }

    #[test]
    fn drop_called_twice_says_the_robot_carries_nothing() {
        let map = world(&[">"]).map().clone();
        let mut world = World::new(
            map,
            Robot::new(Point::new(0, 0), Direction::East).with_item(),
        )
        .unwrap();
        world.drop_item().unwrap();
        assert_eq!(world.drop_item(), Err(RobotError::NotCarrying));
    }
}

mod sensing {
    use super::*;

    #[test]
    fn a_side_is_clear_when_its_cell_is_a_floor_cell_of_the_map() {
        let world = world(&[".#.", ".^#", "..."]);
        assert!(!world.is_clear(Side::Front), "a wall in front");
        assert!(world.is_clear(Side::Left));
        assert!(!world.is_clear(Side::Right), "a wall on the right");
        let world = super::world(&["...", "#>.", "..."]);
        assert!(world.is_clear(Side::Front));
        assert!(world.is_clear(Side::Left));
        assert!(world.is_clear(Side::Right));
        let world = super::world(&["...", "#<.", "..."]);
        assert!(!world.is_clear(Side::Front), "a wall in front");
        let world = super::world(&["^.", ".."]);
        assert!(!world.is_clear(Side::Front), "past the edge");
        assert!(!world.is_clear(Side::Left), "past the edge");
        assert!(world.is_clear(Side::Right));
    }

    #[test]
    fn the_paint_of_each_side_and_of_its_cell() {
        let mut world = world(&[".y.", "r>b", ".#."]);
        world.start_painting(Color::Red);
        assert_eq!(world.paint_here(), Some(Color::Red));
        assert_eq!(world.paint_toward(Side::Front), Some(Color::Blue));
        assert_eq!(world.paint_toward(Side::Left), Some(Color::Yellow));
        assert_eq!(world.paint_toward(Side::Right), None, "a wall has no paint");
        world.turn_left();
        world.forward().unwrap();
        assert_eq!(
            world.paint_toward(Side::Front),
            None,
            "the edge of the map has no paint"
        );
    }

    #[test]
    fn an_item_here_or_in_front() {
        let mut world = world(&[">o"]);
        assert!(!world.item_here());
        assert!(world.item_in_front());
        world.forward().unwrap();
        assert!(world.item_here());
        assert!(!world.item_in_front(), "nothing lies past the edge");
    }
}

/// The passage from `point` toward `direction`, as [`passages`] gives it: from the cell on its
/// west or its north; `None` past the top or the left.
fn passage_key(point: Point, direction: Direction) -> Option<(Point, Direction)> {
    match direction {
        Direction::East | Direction::South => Some((point, direction)),
        Direction::West => Some((point.toward(Direction::West)?, Direction::East)),
        Direction::North => Some((point.toward(Direction::North)?, Direction::South)),
    }
}

/// The painted passages the rules of *Map* give after an action, from the ones before it: the
/// brush paints the passage it crosses, the eraser takes away the one it crosses, and a passage
/// between two cells without paint loses its paint.
struct PassageModel(HashSet<(Point, Direction)>);

impl PassageModel {
    fn crossed(&mut self, from: Point, to: Point, tool: Option<Tool>) {
        let Some(key) = passage_key(from, from.direction_to(to).unwrap()) else {
            return;
        };
        match tool {
            Some(Tool::Brush(_)) => {
                self.0.insert(key);
            }
            Some(Tool::Eraser) => {
                self.0.remove(&key);
            }
            None => {}
        }
    }

    /// Takes away the passages between two cells without paint, after any action.
    fn settle(&mut self, world: &World) {
        let painted = |point: Point| world.map().paint(point).is_some();
        self.0.retain(|&(point, direction)| {
            painted(point) || point.toward(direction).is_some_and(painted)
        });
    }

    fn sorted(&self) -> Vec<(Point, Direction)> {
        let mut passages: Vec<_> = self.0.iter().copied().collect();
        passages
            .sort_by_key(|&(point, direction)| (point.y, point.x, direction == Direction::South));
        passages
    }
}

/// Random actions on a map with walls, items, paints and passages give the painted passages
/// of the rules of *Map*, as [`PassageModel`] computes them, and a painted passage always joins
/// two floor cells, at least one of them painted.
#[test]
fn the_painted_passages_follow_the_rules_of_the_map() {
    let mut random = Random(7);
    for round in 0..50 {
        let start = world(&["..#..", ".orbo", "#.>y.", "..b#."]);
        let mut map = start.map().clone();
        map.set_passage(Point::new(2, 1), Point::new(3, 1)).unwrap();
        map.set_passage(Point::new(3, 1), Point::new(3, 2)).unwrap();
        let mut world = World::new(map, start.robot()).unwrap();
        let mut model = PassageModel(passages(&world).into_iter().collect());
        for action in 0..200 {
            match random.next() % 9 {
                0..=2 => {
                    let from = world.robot().position();
                    if world.forward().is_ok() {
                        let to = world.robot().position();
                        let tool = world.robot().tool();
                        model.crossed(from, to, tool);
                        match tool {
                            Some(Tool::Brush(color)) => {
                                assert_eq!(world.map().paint(to), Some(color), "{round}, {action}");
                            }
                            Some(Tool::Eraser) => {
                                assert_eq!(world.map().paint(to), None, "{round}, {action}");
                            }
                            None => {}
                        }
                    }
                }
                3 => world.turn_left(),
                4 => world.turn_right(),
                5 => {
                    let color = Color::ALL[random.next() % Color::ALL.len()];
                    world.start_painting(color);
                    let here = world.robot().position();
                    assert_eq!(world.map().paint(here), Some(color), "{round}, {action}");
                }
                6 => {
                    world.start_erasing();
                    let here = world.robot().position();
                    assert_eq!(world.map().paint(here), None, "{round}, {action}");
                }
                7 => {
                    world.stop_painting();
                    world.stop_erasing();
                }
                _ => {
                    let _ = world.pick_up().or_else(|_| world.drop_item());
                }
            }
            model.settle(&world);
            assert_eq!(
                passages(&world),
                model.sorted(),
                "round {round}, action {action}"
            );
            let map = world.map();
            for (point, direction) in passages(&world) {
                let other = point.toward(direction).unwrap();
                assert!(
                    map.is_floor(point)
                        && map.is_floor(other)
                        && (map.paint(point).is_some() || map.paint(other).is_some()),
                    "round {round}, action {action}: the passage {direction:?} of {point:?}"
                );
            }
            let position = world.robot().position();
            assert!(
                map.is_floor(position),
                "round {round}, action {action}: the robot on {position:?}"
            );
        }
    }
}
