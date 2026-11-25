//! The names that a line written at a place of a program may use (see *Command menu* in
//! `specs.md`): what the command menu lists under **Your names**, and where Ctrl+click on a
//! function of the program goes.
//!
//! The line at the cursor is being written, wrong most of the time (`let total = `), and the
//! lines under it don't matter: a name is used under its declaration. So only the lines above
//! the cursor are read, with a stand-in for its line, in the block that its indentation gives,
//! and the walk of the checker notes what exists there: the rules of the scopes are written
//! once, in the checker.

use crate::checker;
use crate::parser::{SyntaxError, parse_up_to};
use crate::span::{Position, Span};

/// The names that a line written at a place may use.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct NamesAt {
    /// The functions of the program defined above the place, the one whose body holds it
    /// included, in the order of the source.
    pub functions: Vec<ProgramFunction>,
    /// The variables that exist at the place, in the order of the source: in a function, its
    /// parameters and its own variables; in the main program, its variables. Only those of the
    /// blocks still open there.
    pub variables: Vec<ProgramVariable>,
}

/// A function of the program.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProgramFunction {
    pub name: String,
    /// Its parameters, as written.
    pub parameters: Vec<String>,
    /// Where its name is in its definition.
    pub defined: Span,
}

/// A variable of the program.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProgramVariable {
    pub name: String,
    /// Where its name is in its `let`, or among the parameters of its function.
    pub declared: Span,
    /// The name of the function whose parameter it is; nothing for a variable of a `let`.
    pub parameter_of: Option<String>,
}

/// The names that a line written at `cursor` may use, as the checks before running see them:
/// declared above the cursor, in the blocks open at its line. That line counts in the block
/// that its indentation gives, counted up to the cursor, or in the block that the line above
/// opens when it ends with `:`; nothing that it holds is read.
///
/// # Errors
///
/// The first syntax error of the lines above the cursor, which hides the names: what follows
/// it can't be read reliably.
pub fn names_at(source: &str, cursor: Position) -> Result<NamesAt, SyntaxError> {
    let program = parse_up_to(source, cursor)?;
    // The stand-in is the last statement of the tree, which the walk always reaches (a test of
    // random programs holds it): the default, no name, is never given for a line missed.
    Ok(checker::names_at(&program, cursor.line).unwrap_or_default())
}

#[cfg(test)]
mod tests;
