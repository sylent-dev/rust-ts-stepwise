//! The words of other languages that a learner may write, reserved as the keywords are.

use crate::word_enum::word_enum;

word_enum! {
    /// The words a learner may write from another language, reserved so that each gets a
    /// message that shows the Stepwise way.
    pub enum ForeignWord {
        /// `elif`, written `else if`.
        Elif => "elif",
        /// `def`, written `function`.
        Def => "def",
        /// `var`, written `let`.
        Var => "var",
        /// `const`, written `let`.
        Const => "const",
        /// `for`
        For => "for",
        /// `continue`
        Continue => "continue",
        /// `pass`
        Pass => "pass",
        /// `none`
        NoneWord => "none",
        /// `null`
        Null => "null",
    }
}
