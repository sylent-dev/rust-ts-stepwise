//! The errors of a level file: what only a file can have wrong, and the errors of what it
//! describes (a map, a stroke, goals), which belong to the domain and are wrapped here. Unlike
//! those of the language, only the authors of the levels see them, in the tests: they are
//! codes with their values, and also a sentence in English (`Display`), written here for them
//! all, without a translation until a level editor exists.

use std::fmt;

use crate::world::{BuildError, MAX_COLUMNS, MAX_ROWS, Point};

use super::MAX_MAPS;
use super::build::{FLOOR, WALL};
use super::file::FORMAT_VERSION;
use super::goals::GoalsError;
use super::stroke::StrokeError;

/// Why a level file can't be read.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LevelError {
    /// The map concerned, numbered from 1 in the order of the file, `None` for the file as a
    /// whole (and for the one map of the sandbox).
    pub map: Option<usize>,
    /// What is wrong.
    pub kind: LevelErrorKind,
}

impl LevelError {
    pub(super) const fn file(kind: LevelErrorKind) -> Self {
        Self { map: None, kind }
    }

    pub(super) const fn map(number: usize, kind: LevelErrorKind) -> Self {
        Self {
            map: Some(number),
            kind,
        }
    }
}

/// What is wrong in a level file. The cells are written `[x, y]`, as in the file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LevelErrorKind {
    /// Not valid TOML, or a field missing, unknown or of the wrong type, as the TOML reader
    /// says it, with its line and column.
    Syntax(String),
    /// Another version of the format than the one this core reads.
    Version(u32),
    /// No map, or more than [`MAX_MAPS`].
    MapCount(usize),
    /// A row of the terrain that isn't as long as the first one.
    RowLength {
        /// The row, from 0 at the top.
        y: u8,
        /// Its number of cells.
        length: usize,
        /// The number of cells of the first row.
        expected: usize,
    },
    /// A character of the terrain that is neither a wall nor a floor cell.
    UnknownCharacter {
        /// Its cell.
        at: Point,
        /// The character.
        character: char,
    },
    /// The same cell twice in the items of a map.
    DuplicateItem(Point),
    /// Goals in the map of the sandbox, which has none.
    GoalsInSandbox,
    /// The map can't be built: its size, or an item, a paint or the robot on a wall or
    /// outside it.
    Map(BuildError),
    /// A stroke, of a map or of its goals, can't be.
    Stroke(StrokeError),
    /// The goals can't be those of their map.
    Goals(GoalsError),
}

impl From<StrokeError> for LevelErrorKind {
    fn from(error: StrokeError) -> Self {
        Self::Stroke(error)
    }
}

impl From<GoalsError> for LevelErrorKind {
    fn from(error: GoalsError) -> Self {
        Self::Goals(error)
    }
}

impl std::error::Error for LevelError {}

impl fmt::Display for LevelError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if let Some(number) = self.map {
            write!(f, "map {number}: ")?;
        }
        write!(f, "{}", self.kind)
    }
}

impl fmt::Display for LevelErrorKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Syntax(message) => write!(f, "{message}"),
            Self::Version(version) => write!(
                f,
                "the file has version {version}, while this core reads version {FORMAT_VERSION}"
            ),
            Self::MapCount(count) => write!(
                f,
                "the level has {count} maps, while it has from 1 to {MAX_MAPS}"
            ),
            Self::RowLength {
                y,
                length,
                expected,
            } => write!(
                f,
                "row {y} of the terrain has {length} cells, while the first one has {expected}"
            ),
            Self::UnknownCharacter { at, character } => write!(
                f,
                "{} in the terrain is {character:?}, neither a wall `{WALL}` nor a floor `{FLOOR}`",
                cell(*at)
            ),
            Self::DuplicateItem(at) => write!(f, "two items on {}", cell(*at)),
            Self::GoalsInSandbox => write!(f, "the map of the sandbox has goals"),
            Self::Map(error) => write_build_error(f, *error),
            Self::Stroke(error) => write_stroke_error(f, *error),
            Self::Goals(error) => write_goals_error(f, *error),
        }
    }
}

fn write_build_error(f: &mut fmt::Formatter<'_>, error: BuildError) -> fmt::Result {
    match error {
        BuildError::Size { width, height } => write!(
            f,
            "the terrain is {width} × {height}, while a map has from 1 × 1 to \
             {MAX_COLUMNS} × {MAX_ROWS} cells"
        ),
        BuildError::OutsideMap(at) => write_outside_map(f, at),
        BuildError::OnWall(at) => write_on_wall(f, at),
        BuildError::NotEmpty(at) => write!(f, "{} already has a paint or an item", cell(at)),
        BuildError::NotNeighbors(from, to) => write_not_neighbors(f, from, to),
        BuildError::Unpainted(at) => write!(f, "{} has no paint", cell(at)),
    }
}

fn write_stroke_error(f: &mut fmt::Formatter<'_>, error: StrokeError) -> fmt::Result {
    match error {
        StrokeError::EmptyPath => write!(f, "a stroke has an empty path"),
        StrokeError::NotNeighbors(from, to) => write_not_neighbors(f, from, to),
    }
}

fn write_goals_error(f: &mut fmt::Formatter<'_>, error: GoalsError) -> fmt::Result {
    match error {
        GoalsError::OutsideMap(at) => {
            write!(f, "a goal: ")?;
            write_outside_map(f, at)
        }
        GoalsError::OnWall(at) => {
            write!(f, "a goal: ")?;
            write_on_wall(f, at)
        }
        GoalsError::ConflictingPaint(at) => {
            write!(f, "the goals paint {} in two different colors", cell(at))
        }
        GoalsError::DuplicateItem(at) => {
            write!(f, "the goals want an item on {} twice", cell(at))
        }
        GoalsError::NoGoal => write!(f, "the map has no goal"),
        GoalsError::MetAtStart => write!(f, "the goals are all met before the program runs"),
        GoalsError::NotEnoughItems { needed, available } => write!(
            f,
            "the goals need {needed} items, while the map has {available}"
        ),
    }
}

// The sentences that a map, a stroke and goals share: each says the same thing of a cell.

fn write_outside_map(f: &mut fmt::Formatter<'_>, at: Point) -> fmt::Result {
    write!(f, "{} is outside the map", cell(at))
}

fn write_on_wall(f: &mut fmt::Formatter<'_>, at: Point) -> fmt::Result {
    write!(f, "{} is a wall", cell(at))
}

fn write_not_neighbors(f: &mut fmt::Formatter<'_>, from: Point, to: Point) -> fmt::Result {
    write!(
        f,
        "{} and {} follow each other in a path, while they aren't next to each other",
        cell(from),
        cell(to)
    )
}

/// A cell as the file writes it.
fn cell(at: Point) -> String {
    format!("[{}, {}]", at.x, at.y)
}
