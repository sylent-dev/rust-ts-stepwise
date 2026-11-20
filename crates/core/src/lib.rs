//! The core of Stepwise: its language, run one step at a time, the world of the robot and the
//! levels.
//!
//! The core must never panic: compiled to WebAssembly, a panic aborts the module and the page
//! with it, while every program of a learner, even absurd, must end with an error the
//! interface can show. The lints below, and the methods forbidden by `clippy.toml`, rule out
//! what can panic outside the tests: indexing, `unwrap`, `panic!`, and the arithmetic, since
//! a division by zero panics and an overflow wraps silently in release (use `checked_*`).
#![cfg_attr(
    not(test),
    deny(
        clippy::arithmetic_side_effects,
        clippy::indexing_slicing,
        clippy::string_slice,
        clippy::unwrap_used,
        clippy::expect_used,
        clippy::panic,
        clippy::unreachable,
        clippy::todo,
        clippy::unimplemented
    )
)]
// What the core makes public is what the bridge uses (see Language core in
// docs/technical-choices.md). An item declared `pub` that nothing outside the crate can reach
// is written `pub(crate)`, so that the compiler refuses it in a public signature
// (`unreachable_pub`); and a `pub` type of a private module that a public signature would
// still give is refused too, since the bridge couldn't name it (`unnameable_types`). Outside
// the tests, whose helpers are public to each other.
#![cfg_attr(not(test), warn(unreachable_pub, unnameable_types))]

mod ast;
pub mod builtin;
pub mod checker;
pub mod color;
pub mod foreign_word;
pub mod interpreter;
pub mod level;
pub mod lexer;
pub mod parser;
pub mod program;
pub mod run;
pub mod span;
pub mod world;

mod word_enum;

#[cfg(test)]
mod test_support;

/// The version of the core, from its `Cargo.toml`.
#[must_use]
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
