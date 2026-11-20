//! The world of the robot, for the interface (see *Map* in `specs.md`): the map and the robot
//! as data, read from the world of the core. A level gives it as it starts, and a program
//! being run as it has changed it so far.

use serde::Serialize;
use stepwise_core::{color, world};
use tsify::Tsify;

/// The place of a cell: `x` the column from the left, `y` the row from the top, both from 0.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
pub struct Point {
    /// The column, from 0 on the left.
    pub x: u8,
    /// The row, from 0 at the top.
    pub y: u8,
}

/// A color of paint, as a program writes it: a word of the language, written as the others
/// are (`word.rs`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "snake_case")]
pub enum Color {
    /// `red`
    Red,
    /// `yellow`
    Yellow,
    /// `blue`
    Blue,
}

/// One of the four directions, on the map: north is up, toward the row 0.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "kebab-case")]
pub enum Direction {
    /// Up.
    North,
    /// Right.
    East,
    /// Down.
    South,
    /// Left.
    West,
}

/// The paint of a cell, as the map draws it: a stroke from the middle of the cell toward each
/// of its painted passages, in the color of the cell.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
pub struct Paint {
    /// The color of the cell.
    pub color: Color,
    /// The painted passages of the cell, by the direction of the neighbor each leads to,
    /// clockwise from the north. A passage is given by both of its cells when both are
    /// painted; toward a cell erased on its own, which has no paint to give, the painted
    /// neighbor still gives it, and the map draws its half up to the border.
    pub passages: Vec<Direction>,
}

/// A cell of the map.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum Cell {
    /// A wall: nothing goes in it.
    Wall,
    /// A floor cell, with what lies on it.
    Floor {
        /// Its paint, when it has one.
        #[serde(skip_serializing_if = "Option::is_none")]
        paint: Option<Paint>,
        /// Whether an item lies on it.
        item: bool,
    },
}

/// The tool the robot has down: the brush with its color, or the eraser.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum Tool {
    /// The brush: the robot paints the cells it moves into, and the passages it crosses.
    Brush {
        /// The color of the brush.
        color: Color,
    },
    /// The eraser: the robot removes the paint of the cells it moves into, and of the
    /// passages it crosses.
    Eraser,
}

/// The robot: where it stands, where it faces, whether it carries an item and which tool it
/// has down.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
pub struct Robot {
    /// The cell where it stands.
    pub position: Point,
    /// The direction it faces.
    pub direction: Direction,
    /// Whether it carries an item.
    pub carrying: bool,
    /// The tool it has down, if any. The map never draws it, the learner follows it in their
    /// head: only the animations read it, to lay the stroke of a move or take the paint away.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool: Option<Tool>,
}

/// The map and the robot on it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
pub struct World {
    /// The number of columns of the map.
    pub width: u8,
    /// The number of rows of the map.
    pub height: u8,
    /// The cells row by row from the top left: the cell at `x` and `y` is the one of index
    /// `y * width + x`.
    pub cells: Vec<Cell>,
    /// The robot.
    pub robot: Robot,
}

impl From<world::Point> for Point {
    fn from(point: world::Point) -> Self {
        Self {
            x: point.x,
            y: point.y,
        }
    }
}

impl From<color::Color> for Color {
    fn from(color: color::Color) -> Self {
        match color {
            color::Color::Red => Self::Red,
            color::Color::Yellow => Self::Yellow,
            color::Color::Blue => Self::Blue,
        }
    }
}

impl From<world::Direction> for Direction {
    fn from(direction: world::Direction) -> Self {
        match direction {
            world::Direction::North => Self::North,
            world::Direction::East => Self::East,
            world::Direction::South => Self::South,
            world::Direction::West => Self::West,
        }
    }
}

impl From<world::Tool> for Tool {
    fn from(tool: world::Tool) -> Self {
        match tool {
            world::Tool::Brush(color) => Self::Brush {
                color: color.into(),
            },
            world::Tool::Eraser => Self::Eraser,
        }
    }
}

impl From<world::Robot> for Robot {
    fn from(robot: world::Robot) -> Self {
        Self {
            position: robot.position().into(),
            direction: robot.direction().into(),
            carrying: robot.is_carrying(),
            tool: robot.tool().map(Tool::from),
        }
    }
}

impl From<&world::World> for World {
    fn from(world: &world::World) -> Self {
        let map = world.map();
        Self {
            width: map.width(),
            height: map.height(),
            cells: map.points().map(|at| cell(map, at)).collect(),
            robot: world.robot().into(),
        }
    }
}

/// The cell of `map` at `at`.
fn cell(map: &world::Map, at: world::Point) -> Cell {
    match map.cell(at) {
        Some(world::Cell::Floor(floor)) => Cell::Floor {
            paint: floor.paint().map(|color| Paint {
                color: color.into(),
                passages: passages(|direction| map.passage(at, direction)),
            }),
            item: floor.has_item(),
        },
        // Outside the map counts as a wall, as for the robot.
        Some(world::Cell::Wall) | None => Cell::Wall,
    }
}

/// The directions whose passage is `painted`, clockwise from the north.
#[must_use]
pub fn passages(painted: impl Fn(world::Direction) -> bool) -> Vec<Direction> {
    world::Direction::ALL
        .into_iter()
        .filter(|&direction| painted(direction))
        .map(Direction::from)
        .collect()
}

#[cfg(test)]
mod tests {
    use stepwise_core::level::Sandbox;
    use stepwise_core::{color, world};

    use super::Direction::{self, East, North, South, West};
    use super::{Cell, Color, Paint, Point, Robot, Tool, World};

    /// The world of a sandbox file with this map, the body of its `[map]` table.
    #[track_caller]
    fn core_world(map: &str) -> world::World {
        let source = format!("version = 1\nstarting_code = ''\n\n[map]\n{map}");
        Sandbox::from_toml(&source)
            .expect("a valid sandbox file")
            .world()
            .clone()
    }

    const EMPTY: Cell = Cell::Floor {
        paint: None,
        item: false,
    };

    fn painted(color: Color, passages: &[Direction]) -> Cell {
        Cell::Floor {
            paint: Some(Paint {
                color,
                passages: passages.to_vec(),
            }),
            item: false,
        }
    }

    #[test]
    fn the_cells_come_row_by_row_from_the_top_left() {
        let world = World::from(&core_world(
            r#"
terrain = '''
..#
#..
'''
robot = { at = [1, 0], facing = "south" }
"#,
        ));
        assert_eq!((world.width, world.height), (3, 2));
        assert_eq!(
            world.cells,
            [EMPTY, EMPTY, Cell::Wall, Cell::Wall, EMPTY, EMPTY]
        );
    }

    #[test]
    fn the_robot_keeps_its_cell_its_direction_and_what_it_carries() {
        let world = World::from(&core_world(
            r#"
terrain = '''
...
...
'''
robot = { at = [2, 1], facing = "west", carrying = true }
"#,
        ));
        assert_eq!(
            world.robot,
            Robot {
                position: Point { x: 2, y: 1 },
                direction: Direction::West,
                carrying: true,
                tool: None,
            }
        );
        let robot = World::from(&core_world(
            "terrain = '.'\nrobot = { at = [0, 0], facing = \"north\" }\n",
        ))
        .robot;
        assert_eq!((robot.direction, robot.carrying), (Direction::North, false));
    }

    #[test]
    fn an_item_lies_on_its_cell_with_or_without_paint() {
        let world = World::from(&core_world(
            r#"
terrain = '''
...
'''
robot = { at = [0, 0], facing = "east" }
items = [[1, 0], [2, 0]]
paints = [{ color = "yellow", path = [[2, 0]] }]
"#,
        ));
        let item = |paint| Cell::Floor { paint, item: true };
        let yellow = Paint {
            color: Color::Yellow,
            passages: Vec::new(),
        };
        assert_eq!(world.cells, [EMPTY, item(None), item(Some(yellow))]);
    }

    #[test]
    fn a_painted_cell_gives_its_passages_clockwise_from_the_north() {
        // A red cross centered on [1, 1], then a blue stroke over its east arm.
        let world = World::from(&core_world(
            r#"
terrain = '''
....
....
....
'''
robot = { at = [0, 0], facing = "east" }
paints = [
    { color = "red", path = [[1, 0], [1, 1], [1, 2]] },
    { color = "red", path = [[0, 1], [1, 1], [2, 1]] },
    { color = "blue", path = [[2, 1], [3, 1]] },
]
"#,
        ));
        assert_eq!(
            world.cells,
            [
                EMPTY,
                painted(Color::Red, &[South]),
                EMPTY,
                EMPTY,
                painted(Color::Red, &[East]),
                painted(Color::Red, &[North, East, South, West]),
                // Painted over in blue, the cell keeps the passage of the red stroke.
                painted(Color::Blue, &[East, West]),
                painted(Color::Blue, &[West]),
                EMPTY,
                painted(Color::Red, &[North]),
                EMPTY,
                EMPTY,
            ]
        );
    }

    #[test]
    fn two_painted_cells_next_to_each_other_join_only_along_a_painted_passage() {
        let world = World::from(&core_world(
            r#"
terrain = '''
..
'''
robot = { at = [0, 0], facing = "east" }
paints = [
    { color = "red", path = [[0, 0]] },
    { color = "red", path = [[1, 0]] },
]
"#,
        ));
        assert_eq!(
            world.cells,
            [painted(Color::Red, &[]), painted(Color::Red, &[])]
        );
    }

    #[test]
    fn a_painted_cell_gives_its_passage_toward_a_neighbor_erased_alone() {
        let mut core = core_world(
            r#"
terrain = '''
...
'''
robot = { at = [1, 0], facing = "east" }
paints = [{ color = "red", path = [[0, 0], [1, 0], [2, 0]] }]
"#,
        );
        core.start_erasing();
        let world = World::from(&core);
        // The erased cell gives nothing; each neighbor draws its half up to its border.
        assert_eq!(
            world.cells,
            [
                painted(Color::Red, &[East]),
                EMPTY,
                painted(Color::Red, &[West]),
            ]
        );
    }

    #[test]
    fn the_world_follows_what_the_robot_does() {
        let mut core = core_world(
            r#"
terrain = '''
...
'''
robot = { at = [0, 0], facing = "east" }
items = [[1, 0]]
"#,
        );
        core.start_painting(color::Color::Blue);
        core.forward().expect("a floor cell in front");
        core.pick_up().expect("an item on the cell");
        core.turn_right();
        let world = World::from(&core);
        assert_eq!(
            world.cells,
            [
                painted(Color::Blue, &[East]),
                painted(Color::Blue, &[West]),
                EMPTY,
            ]
        );
        assert_eq!(
            world.robot,
            Robot {
                position: Point { x: 1, y: 0 },
                direction: Direction::South,
                carrying: true,
                tool: Some(Tool::Brush { color: Color::Blue }),
            }
        );
        core.start_erasing();
        assert_eq!(World::from(&core).robot.tool, Some(Tool::Eraser));
        core.stop_erasing();
        assert_eq!(World::from(&core).robot.tool, None);
    }

    #[test]
    fn every_color_and_direction_of_the_core_has_its_own() {
        let colors: Vec<_> = color::Color::ALL.into_iter().map(Color::from).collect();
        assert_eq!(colors, [Color::Red, Color::Yellow, Color::Blue]);
        let directions: Vec<_> = world::Direction::ALL
            .into_iter()
            .map(Direction::from)
            .collect();
        assert_eq!(directions, [North, East, South, West]);
    }
}
