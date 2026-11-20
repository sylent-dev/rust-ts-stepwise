//! What each stretch of a line of code is, for the editor to color it as the learner types:
//! [`classify_line`], the reading of the core that never fails, with the places of the
//! stretches as JavaScript counts them in the line.

use serde::Serialize;
use stepwise_core::lexer;
use tsify::{Ts, Tsify};
use wasm_bindgen::JsError;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::position::Units;

/// What each stretch of a line of code is, from left to right, the blank characters left
/// out: nothing for an empty line.
///
/// `line` is one line, without its line break. It may be wrong in any way, as a line being
/// typed is: a statement never spans two lines, so each line is read alone, as in its
/// program. A `\r` at its end is taken as part of its line break, as the lexer does, and any
/// other line break left in it is a character that the language doesn't read.
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

/// The stretches of `line`, as [`classify_line`] gives them, before they cross to JavaScript:
/// those of the core, from left to right, each with one character at least.
#[must_use]
pub fn stretches(line: &str) -> Vec<Stretch> {
    let mut units = Units::new(line);
    lexer::classify_line(line)
        .into_iter()
        .map(|stretch| Stretch {
            kind: stretch.kind.into(),
            from: units.offset(stretch.start),
            to: units.offset(stretch.end),
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

    #[test]
    fn a_line_break_left_in_a_line_gives_no_empty_stretch() {
        use super::StretchKind::Invalid;
        // A `\r` at the end belongs to the line break: a text cut on `\n` alone reads the same.
        assert_eq!(stretches("forward()\r"), stretches("forward()"));
        // Anywhere else, a line break is a character that the language doesn't read, placed
        // as the core places it.
        assert_eq!(
            read("a\nb\r c"),
            [
                (Name, "a"),
                (Invalid, "\n"),
                (Name, "b"),
                (Invalid, "\r"),
                (Name, "c")
            ]
            .map(|(kind, text)| (kind, text.to_owned()))
        );
    }

    #[test]
    fn every_stretch_holds_the_characters_that_the_core_gives_it() {
        let pieces = [
            "let",
            "côté",
            "=",
            "\"🤖 ok\"",
            "#",
            "🤖",
            "\r",
            "\n",
            " ",
            "'",
            "𝒳",
            "forward(",
            "\"\\",
        ];
        let mut random = 7_u64;
        for _ in 0..2_000 {
            let mut line = String::new();
            for _ in 0..12 {
                random = random
                    .wrapping_mul(6_364_136_223_846_793_005)
                    .wrapping_add(1_442_695_040_888_963_407);
                let index = usize::try_from(random >> 33).unwrap() % pieces.len();
                line.push_str(pieces[index]);
            }
            // The line as the core reads it: without the `\r` of its line break.
            let read_line = line.strip_suffix('\r').unwrap_or(&line);
            let characters: Vec<char> = read_line.chars().collect();
            let units: Vec<u16> = line.encode_utf16().collect();
            let core = stepwise_core::lexer::classify_line(&line);
            let bridge = stretches(&line);
            assert_eq!(core.len(), bridge.len(), "in {line:?}");
            let mut after = 0;
            for (core, bridge) in core.iter().zip(&bridge) {
                assert!(
                    after <= bridge.from && bridge.from < bridge.to,
                    "in {line:?}"
                );
                after = bridge.to;
                let start = usize::try_from(core.start).unwrap() - 1;
                let end = usize::try_from(core.end).unwrap() - 1;
                let expected: String = characters[start..end].iter().collect();
                let from = usize::try_from(bridge.from).unwrap();
                let to = usize::try_from(bridge.to).unwrap();
                assert_eq!(
                    String::from_utf16(&units[from..to]).unwrap(),
                    expected,
                    "in {line:?}"
                );
            }
        }
    }
}
