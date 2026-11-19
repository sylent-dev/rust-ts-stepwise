//! The goals of a map, all checked when the program ends without error (see *Goals* in
//! *Levels and progression*, `specs.md`).

use super::stroke::Stroke;
use crate::color::Color;
use crate::world::{Cell, Direction, Map, Point, World};

/// The goals of a map: each is optional, and a map has at least one.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Goals {
    robot_at: Option<Point>,
    /// The strokes to paint, kept whole for the marks of the map, which draw their passages.
    paints: Vec<Stroke>,
    /// Each cell of the strokes once, with its color: the goals only look at the cells.
    paint_cells: Vec<(Point, Color)>,
    nothing_else_painted: bool,
    items_at: Vec<Point>,
    carrying: Option<bool>,
}

/// Why goals can't be those of a map: no program could pass it, or an empty one would.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GoalsError {
    /// A goal outside the map.
    OutsideMap(Point),
    /// A goal on a wall.
    OnWall(Point),
    /// A cell that two strokes want in two different colors.
    ConflictingPaint(Point),
    /// The same cell twice in the cells where an item should lie.
    DuplicateItem(Point),
    /// No goal at all: an empty program would pass the map.
    NoGoal,
    /// Goals all met before the program runs: an empty program would pass the map.
    MetAtStart,
    /// More items needed by the goals (on their cells, and carried) than the world has (on
    /// its cells, and carried by the robot).
    NotEnoughItems {
        /// The items the goals need.
        needed: usize,
        /// The items of the world.
        available: usize,
    },
}

/// A goal not met at the end of a run, with its cell when it has one, where the map plants
/// its flag.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GoalNotMet {
    /// The robot doesn't stand on this cell.
    RobotNotAt(Point),
    /// This cell doesn't have this paint: another one, or none.
    PaintMissing {
        /// The cell.
        at: Point,
        /// The paint it should have.
        color: Color,
    },
    /// This cell is painted, while no other cell than those of the goals should be.
    PaintedElsewhere(Point),
    /// No item lies on this cell.
    ItemMissing(Point),
    /// The robot should carry an item, and carries none.
    NotCarrying,
    /// The robot should carry nothing, and carries an item.
    Carrying,
}

impl Goals {
    /// The cell where the robot should stand.
    #[must_use]
    pub const fn robot_at(&self) -> Option<Point> {
        self.robot_at
    }

    /// Each cell of the strokes to paint, once, with its color, in the order of the strokes:
    /// what the goals look at, and where the map marks them.
    #[must_use]
    pub fn paint_cells(&self) -> &[(Point, Color)] {
        &self.paint_cells
    }

    /// Whether a stroke to paint crosses the passage from the cell at `point` to its neighbor
    /// in `direction`: what [`Map::passage`] says once the strokes are painted as written. The
    /// goals don't look at the passages; the marks of the map draw them.
    #[must_use]
    pub fn passage(&self, point: Point, direction: Direction) -> bool {
        let Some(neighbor) = point.toward(direction) else {
            return false;
        };
        self.paints
            .iter()
            .flat_map(Stroke::passages)
            .any(|passage| passage == (point, neighbor) || passage == (neighbor, point))
    }

    /// The cells where an item should lie.
    #[must_use]
    pub fn items_at(&self) -> &[Point] {
        &self.items_at
    }

    /// Every goal not met on `world`, in the order of the goals: where to stand, the paints,
    /// the cells painted in excess (row by row), the items, what the robot carries. Empty when
    /// every goal is met.
    #[must_use]
    pub fn check(&self, world: &World) -> Vec<GoalNotMet> {
        let map = world.map();
        let robot = world.robot();
        let mut not_met = Vec::new();
        if let Some(at) = self.robot_at
            && robot.position() != at
        {
            not_met.push(GoalNotMet::RobotNotAt(at));
        }
        for &(at, color) in &self.paint_cells {
            if map.paint(at) != Some(color) {
                not_met.push(GoalNotMet::PaintMissing { at, color });
            }
        }
        if self.nothing_else_painted {
            not_met.extend(
                map.points()
                    .filter(|&at| map.paint(at).is_some())
                    .filter(|&at| !self.paint_cells.iter().any(|&(cell, _)| cell == at))
                    .map(GoalNotMet::PaintedElsewhere),
            );
        }
        for &at in &self.items_at {
            if !map.has_item(at) {
                not_met.push(GoalNotMet::ItemMissing(at));
            }
        }
        match self.carrying {
            Some(true) if !robot.is_carrying() => not_met.push(GoalNotMet::NotCarrying),
            Some(false) if robot.is_carrying() => not_met.push(GoalNotMet::Carrying),
            _ => {}
        }
        not_met
    }

    /// The goals of a map of `world` as it starts. Each is optional; a stroke may come back
    /// on a cell of another one in the same color.
    ///
    /// # Errors
    ///
    /// When a goal is on a wall or outside the map, two strokes want a cell in two colors, a
    /// cell is given twice for an item, or the goals are none, need more items than the world
    /// has, or are all met already: no program could pass the map, or an empty one would.
    pub(super) fn new(
        robot_at: Option<Point>,
        paints: Vec<Stroke>,
        nothing_else_painted: bool,
        items_at: Vec<Point>,
        carrying: Option<bool>,
        world: &World,
    ) -> Result<Self, GoalsError> {
        let map = world.map();
        if let Some(at) = robot_at {
            floor(map, at)?;
        }
        let mut paint_cells: Vec<(Point, Color)> = Vec::new();
        for stroke in &paints {
            for &at in stroke.path() {
                floor(map, at)?;
                match paint_cells.iter().find(|&&(cell, _)| cell == at) {
                    Some(&(_, color)) if color != stroke.color() => {
                        return Err(GoalsError::ConflictingPaint(at));
                    }
                    Some(_) => {}
                    None => paint_cells.push((at, stroke.color())),
                }
            }
        }
        for (index, &at) in items_at.iter().enumerate() {
            floor(map, at)?;
            if items_at.iter().take(index).any(|&before| before == at) {
                return Err(GoalsError::DuplicateItem(at));
            }
        }
        let goals = Self {
            robot_at,
            paints,
            paint_cells,
            nothing_else_painted,
            items_at,
            carrying,
        };
        goals.check_possible(world)?;
        Ok(goals)
    }

    /// Refuses goals that are none, that no program can meet, or that an empty program already
    /// meets.
    fn check_possible(&self, world: &World) -> Result<(), GoalsError> {
        if self.robot_at.is_none()
            && self.paints.is_empty()
            && !self.nothing_else_painted
            && self.items_at.is_empty()
            && self.carrying.is_none()
        {
            return Err(GoalsError::NoGoal);
        }
        let map = world.map();
        let needed = self
            .items_at
            .len()
            .saturating_add(usize::from(self.carrying == Some(true)));
        let available = map
            .points()
            .filter(|&at| map.has_item(at))
            .count()
            .saturating_add(usize::from(world.robot().is_carrying()));
        if needed > available {
            return Err(GoalsError::NotEnoughItems { needed, available });
        }
        if self.check(world).is_empty() {
            return Err(GoalsError::MetAtStart);
        }
        Ok(())
    }
}

/// Refuses a goal on a wall or outside the map.
fn floor(map: &Map, at: Point) -> Result<(), GoalsError> {
    match map.cell(at) {
        Some(Cell::Floor(_)) => Ok(()),
        Some(Cell::Wall) => Err(GoalsError::OnWall(at)),
        None => Err(GoalsError::OutsideMap(at)),
    }
}
