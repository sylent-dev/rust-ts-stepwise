//! The interpreter: runs a checked program one step at a time (see *Running a program* in
//! `specs.md`, and Interpreter in `docs/technical-choices.md`).
//!
//! The program is first translated into a flat list of instructions (`compiler`), which the
//! [`Machine`] owns and runs: its whole state is data, never the stack of Rust, so that it
//! pauses between two steps anywhere, even in the middle of an expression, and so that the
//! calls in progress and their variables are read as they are ([`Machine::calls`]).
//!
//! The parts depend on each other in one direction: the values (`value`), the errors that
//! name their types (`error`), what the operators compute (`operators`), the instructions
//! (`code`) and their translation (`compiler`), what a step reports (`event`), what the
//! built-in functions do to the world of the robot (`builtins`), what each instruction
//! changes (`memory`), and the machine (`machine`) above them all, which runs the
//! instructions up to the end of a step. The program acts on the world through `builtins`
//! alone; the machine knows nothing of the goals of a level, which a run checks on its world
//! once the program has ended (`crate::run`).

mod builtins;
mod code;
mod compiler;
mod error;
mod event;
mod machine;
mod memory;
mod operators;
mod value;

#[cfg(test)]
mod tests;

pub use crate::ast::{BinaryOperator, UnaryOperator};
pub use error::{RuntimeError, RuntimeErrorKind};
pub use event::{Action, Event};
pub use machine::{Machine, State};
pub use memory::{CallInProgress, MAX_CALL_DEPTH, Variable};
pub use value::{MAX_TEXT_LENGTH, Value, ValueType};

use crate::program::Checked;

/// The lines of `program` where a step starts, from 1, in order and each once: those a
/// breakpoint can pause the program on (see *Code editor* in `specs.md`). Every statement but
/// the definition of a function, and each `else if`; never the line of an `else:`, a blank
/// line nor a comment. The lines of a function that no call enters are among them: a step
/// would start there if one did.
///
/// They are read in the instructions that the machine runs, where a step ends on each
/// [`Line`](code::Instruction::Line): a rule written once. Should the compiler refuse a
/// checked program, a mistake of the core, there is none.
#[must_use]
pub fn step_lines(program: &Checked) -> Vec<u32> {
    let Ok(code) = compiler::compile(program.program()) else {
        return Vec::new();
    };
    let mut lines: Vec<u32> = code.step_lines().collect();
    lines.sort_unstable();
    lines.dedup();
    lines
}
