//! What each stretch of a line of code is, for the editor to color it as the learner types:
//! [`classify_line`], the reading of the core that never fails, with the places of the
//! stretches as JavaScript counts them in the line.

use serde::Serialize;
use stepwise_core::lexer;
use stepwise_core::span::Position;
use tsify::{Ts, Tsify};
use wasm_bindgen::JsError;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::position::Offsets;

/// What each stretch of a line of code is, from left to right, the blank characters left
/// out: nothing for an empty line.
///
/// `line` is one line, without its line break. It may be wrong in any way, as a line being
/// typed is: a statement never spans two lines, so each line is read alone, as in its
/// program.
///
/// # Errors
///
/// It throws when a stretch can't be made a JavaScript object, which none of them does.
#[wasm_bindgen(js_name = classifyLine)]
pub fn classify_line(line: &str) -> Result<Vec<Ts<Stretch>>, JsError> {
    stretches(line)
        .iter()
        .map(|stretch| Ok(Ts::from_rust(stretch)?))
        .collect()
}

/// The stretches of `line`, as [`classify_line`] gives them, before they cross to JavaScript.
#[must_use]
pub fn stretches(line: &str) -> Vec<Stretch> {
    let offsets = Offsets::new(line);
    let offset = |column| offsets.offset(Position::new(1, column));
    lexer::classify_line(line)
        .into_iter()
        .map(|stretch| Stretch {
            kind: stretch.kind.into(),
            from: offset(stretch.start),
            to: offset(stretch.end),
        })
        .collect()
}

/// A stretch of a line of code, and what it is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
pub struct Stretch {
    /// What the stretch is.
    pub kind: StretchKind,
    /// The offset of its start in the line, in UTF-16 code units, as JavaScript indexes it.
    pub from: u32,
    /// The offset just after its end: the stretch is `line.slice(from, to)`.
    pub to: u32,
}

/// What a stretch of a line of code is: each variant is the one of the same name in the
/// core, where it is described.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "kebab-case")]
pub enum StretchKind {
    Keyword,
    Boolean,
    Number,
    Text,
    Color,
    Function,
    Name,
    Symbol,
    Comment,
    Invalid,
}

impl From<lexer::StretchKind> for StretchKind {
    fn from(kind: lexer::StretchKind) -> Self {
        use lexer::StretchKind as K;
        match kind {
            K::Keyword => Self::Keyword,
            K::Boolean => Self::Boolean,
            K::Number => Self::Number,
            K::Text => Self::Text,
            K::Color => Self::Color,
            K::Function => Self::Function,
            K::Name => Self::Name,
            K::Symbol => Self::Symbol,
            K::Comment => Self::Comment,
            K::Invalid => Self::Invalid,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::StretchKind::{Comment, Function, Keyword, Name, Symbol, Text};
    use super::{StretchKind, stretches};

    /// The stretches of `line`, each as what it is and the text that JavaScript cuts for it.
    fn read(line: &str) -> Vec<(StretchKind, String)> {
        let units: Vec<u16> = line.encode_utf16().collect();
        stretches(line)
            .into_iter()
            .map(|stretch| {
                let from = usize::try_from(stretch.from).unwrap();
                let to = usize::try_from(stretch.to).unwrap();
                (stretch.kind, String::from_utf16(&units[from..to]).unwrap())
            })
            .collect()
    }

    #[test]
    fn a_stretch_is_cut_where_javascript_counts_it() {
        // An emoji takes two units, an accent one: the offsets after them follow.
        let line = "    let côté = \"🤖 ok 🤖\" # 𝒳 and é";
        assert_eq!(
            read(line),
            [
                (Keyword, "let"),
                (Name, "côté"),
                (Symbol, "="),
                (Text, "\"🤖 ok 🤖\""),
                (Comment, "# 𝒳 and é"),
            ]
            .map(|(kind, text)| (kind, text.to_owned()))
        );
        let places: Vec<(u32, u32)> = stretches(line)
            .into_iter()
            .map(|stretch| (stretch.from, stretch.to))
            .collect();
        assert_eq!(places, [(4, 7), (8, 12), (13, 14), (15, 25), (26, 36)]);
    }

    #[test]
    fn a_line_that_is_wrong_keeps_its_stretches() {
        assert_eq!(
            read("print(\"I am stu"),
            [(Function, "print"), (Symbol, "("), (Text, "\"I am stu")]
                .map(|(kind, text)| (kind, text.to_owned()))
        );
        assert_eq!(stretches(""), []);
        assert_eq!(stretches("    "), []);
    }
}
