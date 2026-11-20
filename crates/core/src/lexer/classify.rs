//! What each stretch of a line of code is, for the editor to color it as the learner types.
//!
//! [`classify_line`] reads a line with the cursor of the lexer, so that the rules of the
//! language are written once, but it never fails: a line being typed is wrong most of the
//! time (a text not closed yet, a word half written), and must keep its colors. A statement
//! never spans two lines, so a line read alone is read as in its program.

use super::error::LexErrorKind;
use super::token::{Keyword, TokenKind};
use super::{Cursor, Piece};
use crate::builtin::Builtin;
use crate::color::Color;
use crate::foreign_word::ForeignWord;

/// A stretch of a line of code, and what it is.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Stretch {
    /// What the stretch is.
    pub kind: StretchKind,
    /// The column of its first character, from 1, in characters.
    pub start: u32,
    /// The column just after its last character.
    pub end: u32,
}

/// What a stretch of a line of code is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StretchKind {
    /// A keyword, but `true` and `false`: `if`, `while`, `function`, `let`, `and`.
    Keyword,
    /// `true` or `false`.
    Boolean,
    /// A whole number, even one too large for a program.
    Number,
    /// A text with its quotes, even one whose closing quote is missing, which then runs to
    /// the end of the line, or one with an escape that the language doesn't have.
    Text,
    /// A color: `red`.
    Color,
    /// The name of a function: a built-in function wherever it is written, or a name that
    /// isn't reserved followed by a `(`, which is called or defined there.
    Function,
    /// Any other name: a variable, a parameter, a word of another language wherever it is
    /// written.
    Name,
    /// A symbol of the language: an operator, a parenthesis, a comma, a `:`.
    Symbol,
    /// A comment, from its `#` to the end of the line.
    Comment,
    /// Characters that the language doesn't read outside a text or a comment: a `'`, a `;`,
    /// a tab, a word that starts with a digit.
    Invalid,
}

/// The stretches of `line`, a line of code without its line break, from left to right: what
/// the lexer reads on it, the spaces left out, and any blank character before the first
/// stretch.
///
/// It never fails, and gives nothing for an empty line. The stretches follow each other
/// without overlapping, and each holds one character at least.
///
/// A `\r` at the end of the line belongs to its line break, as for the lexer (`\r\n`): a
/// text cut on `\n` alone gives the same stretches. Any other line break left in `line` is a
/// character that the language doesn't read.
#[must_use]
pub fn classify_line(line: &str) -> Vec<Stretch> {
    let mut cursor = Cursor::new(line.strip_suffix('\r').unwrap_or(line), 1);
    // Blank characters of any kind before the first piece: an indentation has no color, and
    // the checks say what is wrong in it.
    while cursor.bump_if(char::is_whitespace).is_some() {}
    let mut pieces = std::iter::from_fn(|| cursor.piece()).peekable();
    let mut stretches = Vec::new();
    while let Some((piece, span)) = pieces.next() {
        let called = matches!(pieces.peek(), Some((Piece::Token(TokenKind::LeftParen), _)));
        stretches.push(Stretch {
            kind: kind_of(&piece, called),
            start: span.start.column,
            end: span.end.column,
        });
    }
    stretches
}

/// What a piece read by the cursor is; `called` says that a `(` follows it.
fn kind_of(piece: &Piece, called: bool) -> StretchKind {
    match piece {
        Piece::Comment => StretchKind::Comment,
        Piece::Token(token) => match token {
            TokenKind::Keyword(Keyword::True | Keyword::False) => StretchKind::Boolean,
            TokenKind::Keyword(_) => StretchKind::Keyword,
            TokenKind::Number(_) => StretchKind::Number,
            TokenKind::Text(_) => StretchKind::Text,
            TokenKind::Name(name) => name_kind(name, called),
            TokenKind::LeftParen
            | TokenKind::RightParen
            | TokenKind::Comma
            | TokenKind::Colon
            | TokenKind::Equal
            | TokenKind::EqualEqual
            | TokenKind::NotEqual
            | TokenKind::Less
            | TokenKind::LessEqual
            | TokenKind::Greater
            | TokenKind::GreaterEqual
            | TokenKind::Plus
            | TokenKind::Minus
            | TokenKind::Star
            | TokenKind::Slash
            | TokenKind::Percent
            // The marks of the layout come from the lines of a source, never from the
            // characters of one: the cursor gives none.
            | TokenKind::Newline
            | TokenKind::Indent
            | TokenKind::Dedent
            | TokenKind::End => StretchKind::Symbol,
        },
        Piece::Refused(error) => match error.kind {
            LexErrorKind::UnclosedText | LexErrorKind::UnknownEscape { .. } => StretchKind::Text,
            LexErrorKind::NumberTooLarge => StretchKind::Number,
            LexErrorKind::Tab
            | LexErrorKind::WrongIndent { .. }
            | LexErrorKind::SingleQuote
            | LexErrorKind::NameStartsWithDigit { .. }
            | LexErrorKind::SymbolForKeyword { .. }
            | LexErrorKind::UnexpectedCharacter { .. } => StretchKind::Invalid,
        },
    }
}

/// What a name is: the reserved words first, each list of them, which stay what they are
/// wherever they are written, then a name followed by a `(`.
fn name_kind(name: &str, called: bool) -> StretchKind {
    if Builtin::from_word(name).is_some() {
        StretchKind::Function
    } else if Color::from_word(name).is_some() {
        StretchKind::Color
    } else if ForeignWord::from_word(name).is_some() {
        // Never a function of the program, even before a `(`: `for (…)`, `none()`.
        StretchKind::Name
    } else if called {
        StretchKind::Function
    } else {
        StretchKind::Name
    }
}
