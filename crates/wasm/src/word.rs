//! The words of the language, for the interface: the keywords, the words of other languages
//! and the built-in functions, each list a TypeScript union of the words as they are written
//! (`'let' | 'if' | …`), so that a table of the interface keyed by one of them names every
//! word, and a word added to the core is refused there until it is placed.
//!
//! Each enum is the one of the same name in the core, and each variant the word of the same
//! name: the conversion names them all, and a test compares what the interface reads with
//! what the core writes. The colors have theirs with the world (`world.rs`).

use serde::Serialize;
use stepwise_core::{builtin, lexer, parser};
use tsify::Tsify;

/// A keyword of the language.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "snake_case")]
pub enum Keyword {
    Let,
    If,
    Else,
    While,
    Repeat,
    Break,
    Function,
    Return,
    And,
    Or,
    Not,
    True,
    False,
}

impl From<lexer::Keyword> for Keyword {
    fn from(keyword: lexer::Keyword) -> Self {
        use lexer::Keyword as K;
        match keyword {
            K::Let => Self::Let,
            K::If => Self::If,
            K::Else => Self::Else,
            K::While => Self::While,
            K::Repeat => Self::Repeat,
            K::Break => Self::Break,
            K::Function => Self::Function,
            K::Return => Self::Return,
            K::And => Self::And,
            K::Or => Self::Or,
            K::Not => Self::Not,
            K::True => Self::True,
            K::False => Self::False,
        }
    }
}

/// A word of another language that a learner may write, reserved with a message of its own.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "snake_case")]
pub enum ForeignWord {
    Elif,
    Def,
    Var,
    Const,
    For,
    Continue,
    Pass,
    /// `none`, named as in the core, where `None` is already a word of Rust.
    #[serde(rename = "none")]
    NoneWord,
    Null,
}

impl From<parser::ForeignWord> for ForeignWord {
    fn from(word: parser::ForeignWord) -> Self {
        use parser::ForeignWord as W;
        match word {
            W::Elif => Self::Elif,
            W::Def => Self::Def,
            W::Var => Self::Var,
            W::Const => Self::Const,
            W::For => Self::For,
            W::Continue => Self::Continue,
            W::Pass => Self::Pass,
            W::NoneWord => Self::NoneWord,
            W::Null => Self::Null,
        }
    }
}

/// A built-in function, by its name, without its parentheses.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "snake_case")]
pub enum Builtin {
    Forward,
    TurnLeft,
    TurnRight,
    StartPainting,
    StopPainting,
    StartErasing,
    StopErasing,
    PickUp,
    Drop,
    FrontIsClear,
    LeftIsClear,
    RightIsClear,
    HereIs,
    FrontIs,
    LeftIs,
    RightIs,
    ItemHere,
    ItemInFront,
    IsCarrying,
    IsPainting,
    IsErasing,
    Print,
}

impl From<builtin::Builtin> for Builtin {
    fn from(function: builtin::Builtin) -> Self {
        use builtin::Builtin as B;
        match function {
            B::Forward => Self::Forward,
            B::TurnLeft => Self::TurnLeft,
            B::TurnRight => Self::TurnRight,
            B::StartPainting => Self::StartPainting,
            B::StopPainting => Self::StopPainting,
            B::StartErasing => Self::StartErasing,
            B::StopErasing => Self::StopErasing,
            B::PickUp => Self::PickUp,
            B::Drop => Self::Drop,
            B::FrontIsClear => Self::FrontIsClear,
            B::LeftIsClear => Self::LeftIsClear,
            B::RightIsClear => Self::RightIsClear,
            B::HereIs => Self::HereIs,
            B::FrontIs => Self::FrontIs,
            B::LeftIs => Self::LeftIs,
            B::RightIs => Self::RightIs,
            B::ItemHere => Self::ItemHere,
            B::ItemInFront => Self::ItemInFront,
            B::IsCarrying => Self::IsCarrying,
            B::IsPainting => Self::IsPainting,
            B::IsErasing => Self::IsErasing,
            B::Print => Self::Print,
        }
    }
}

#[cfg(test)]
mod tests {
    use stepwise_core::{builtin, lexer, parser};
    use tsify::Tsify;

    use super::{Builtin, ForeignWord, Keyword};

    /// The words of a TypeScript union of texts, in its order: what its declaration holds
    /// between quotes.
    fn union(declaration: &str) -> Vec<&str> {
        declaration.split('"').skip(1).step_by(2).collect()
    }

    /// The interface reads a word by the name that `serde` gives its variant, which is also
    /// the one of its TypeScript type: each list must be the one of the core, word for word.
    #[test]
    fn each_union_holds_the_words_of_the_core_as_they_are_written() {
        assert_eq!(
            union(Keyword::DECL),
            lexer::Keyword::ALL.map(lexer::Keyword::as_str)
        );
        assert_eq!(
            union(ForeignWord::DECL),
            parser::ForeignWord::ALL.map(parser::ForeignWord::as_str)
        );
        assert_eq!(
            union(Builtin::DECL),
            builtin::Builtin::ALL.map(builtin::Builtin::as_str)
        );
    }

    #[test]
    fn the_words_of_a_union_are_what_it_holds_between_quotes() {
        assert_eq!(
            union(r#"export type Side = "left" | "right";"#),
            ["left", "right"]
        );
    }
}
