//! The lexer: turns the source of a program into the tokens the parser reads, and says what
//! each stretch of a line is, for the editor to color it ([`classify_line`]).
//!
//! It reads the source line by line, since a statement never spans two lines (see *Lines and
//! indentation* in `specs.md`):
//!
//! - an empty line or a comment line is skipped, whatever its indentation, tabs and other
//!   blank characters included; the place of each comment line is kept aside, for the parser
//!   to tell a block that holds only comments from an empty one;
//! - the indentation of any other line, in spaces only, opens a block with an `Indent` token
//!   when it is four spaces more than the line above, or closes blocks with one `Dedent`
//!   each when it goes back to an enclosing line; any other indentation is an error;
//! - the tokens of the line follow, up to its end or a `#`, then a `Newline`.
//!
//! The source ends with a `Dedent` per block still open, then `End`.
//!
//! Whether an indented line follows a `:`, and whether a `:` is followed by an indented line,
//! is left to the parser: it can then say that the `:` is missing on the line above, rather
//! than that the next line is indented. The lexer stops at the first error, as the parser
//! does, since what follows can't be read reliably.
//!
//! The tokens stay in the core: outside it, a source is checked whole
//! ([`check`](crate::program::check)). The colors of the editor can't wait for a source
//! without error, so [`classify_line`] reads one line with the same cursor and goes on after
//! what is wrong (`classify.rs`).

mod classify;
mod error;
mod token;

#[cfg(test)]
mod tests;

pub use classify::{Stretch, StretchKind, classify_line};
pub use error::{LexError, LexErrorKind};
pub use token::Keyword;
pub(crate) use token::{Token, TokenKind};

use std::iter::Peekable;
use std::str::Chars;

use crate::span::{Position, Span};

/// The number of spaces that indent a block further than the line that opens it.
pub const INDENT_WIDTH: u32 = 4;

/// The largest whole number a program writes: the values are 64-bit, and a number is written
/// without its `-`.
pub const MAX_NUMBER: i64 = i64::MAX;

/// What the lexer reads in a source.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct Lexed {
    /// The tokens, ending with [`TokenKind::End`].
    pub tokens: Vec<Token>,
    /// The comment of each line that holds only a comment, from its `#` to its last
    /// character, in the order of the source. These lines give no token.
    pub comments: Vec<Span>,
}

/// The tokens of `source`, with the places of its comment lines.
///
/// A line break is `\n` or `\r\n`.
///
/// # Errors
///
/// The first error of the source: a tab, a wrong indentation, a text not closed or with an
/// unknown escape, a number too large, a word that starts with a digit, or a character that
/// has no meaning outside a text or a comment.
pub(crate) fn tokenize(source: &str) -> Result<Lexed, LexError> {
    let mut lexer = Lexer {
        tokens: Vec::new(),
        comments: Vec::new(),
        levels: Vec::new(),
    };
    let mut end = Position::new(1, 1);
    for (index, line) in source.split('\n').enumerate() {
        let number = saturating_u32(index).saturating_add(1);
        end = lexer.line(line.strip_suffix('\r').unwrap_or(line), number)?;
    }
    for _ in 0..lexer.levels.len() {
        lexer.push(TokenKind::Dedent, Span::at(end));
    }
    lexer.push(TokenKind::End, Span::at(end));
    Ok(Lexed {
        tokens: lexer.tokens,
        comments: lexer.comments,
    })
}

/// The state kept from one line to the next.
struct Lexer {
    tokens: Vec<Token>,
    /// The comment of each comment line read, from its `#` to its last character.
    comments: Vec<Span>,
    /// The indentation of each block still open, in spaces, the innermost last: empty at the
    /// top level.
    levels: Vec<u32>,
}

impl Lexer {
    fn push(&mut self, kind: TokenKind, span: Span) {
        self.tokens.push(Token { kind, span });
    }

    /// The indentation of the innermost block open, `0` at the top level.
    fn level(&self) -> u32 {
        self.levels.last().copied().unwrap_or(0)
    }

    /// Reads one line, without its line break, and returns the position of its end.
    fn line(&mut self, line: &str, number: u32) -> Result<Position, LexError> {
        let length = saturating_u32(line.chars().count());
        let end = Position::new(number, length.saturating_add(1));
        // Blank characters of any kind, tabs and non-breaking spaces included: a line that
        // looks empty is empty.
        let content = line.trim_start();
        if content.is_empty() {
            return Ok(end);
        }
        if content.starts_with('#') {
            // Without the blank characters before the `#` nor those after the comment.
            let width = saturating_u32(content.trim_end().chars().count());
            let before = length.saturating_sub(saturating_u32(content.chars().count()));
            let start = before.saturating_add(1);
            self.comments.push(Span::new(
                Position::new(number, start),
                Position::new(number, start.saturating_add(width)),
            ));
            return Ok(end);
        }
        let mut cursor = Cursor::new(line, number);

        let mut spaces: u32 = 0;
        let mut tab = None;
        while let Some(character @ (' ' | '\t')) = cursor.peek() {
            if character == ' ' {
                spaces = spaces.saturating_add(1);
            } else if tab.is_none() {
                tab = Some(cursor.position());
            }
            cursor.bump();
        }
        let first = cursor.position();
        if let Some(tab) = tab {
            return Err(LexError {
                kind: LexErrorKind::Tab,
                span: Span::new(tab, Position::new(number, tab.column.saturating_add(1))),
            });
        }
        self.indent(spaces, Span::new(Position::new(number, 1), first))?;

        let mut last_end = first;
        while let Some(token) = cursor.token()? {
            last_end = token.span.end;
            self.tokens.push(token);
        }
        self.push(TokenKind::Newline, Span::at(last_end));
        Ok(end)
    }

    /// Opens or closes the blocks for a line indented by `found` spaces, `span` covering
    /// its indentation.
    fn indent(&mut self, found: u32, span: Span) -> Result<(), LexError> {
        let current = self.level();
        if found > current {
            let above = current.saturating_add(INDENT_WIDTH);
            if found != above {
                return Err(LexError {
                    kind: LexErrorKind::WrongIndent {
                        found,
                        below: current,
                        above,
                    },
                    span,
                });
            }
            self.levels.push(found);
            self.push(TokenKind::Indent, span);
            return Ok(());
        }
        while let Some(&above) = self.levels.last()
            && found < above
        {
            self.levels.pop();
            let below = self.level();
            if found > below {
                return Err(LexError {
                    kind: LexErrorKind::WrongIndent {
                        found,
                        below,
                        above,
                    },
                    span,
                });
            }
            self.push(TokenKind::Dedent, Span::at(span.end));
        }
        Ok(())
    }
}

/// Reads the characters of one line, keeping their position.
struct Cursor<'a> {
    chars: Peekable<Chars<'a>>,
    line: u32,
    /// The column of the next character.
    column: u32,
}

impl<'a> Cursor<'a> {
    fn new(line: &'a str, number: u32) -> Self {
        Self {
            chars: line.chars().peekable(),
            line: number,
            column: 1,
        }
    }

    /// The position of the next character.
    fn position(&self) -> Position {
        Position::new(self.line, self.column)
    }

    fn peek(&mut self) -> Option<char> {
        self.chars.peek().copied()
    }

    /// Takes the next character if `accept` accepts it: the only place that moves the column.
    fn bump_if(&mut self, accept: impl FnOnce(char) -> bool) -> Option<char> {
        let character = self.chars.next_if(|&character| accept(character))?;
        self.column = self.column.saturating_add(1);
        Some(character)
    }

    /// Takes the next character.
    fn bump(&mut self) -> Option<char> {
        self.bump_if(|_| true)
    }

    /// Takes the next character if it is `expected`.
    fn eat(&mut self, expected: char) -> bool {
        self.bump_if(|character| character == expected).is_some()
    }

    /// The error `kind` over the characters read since `start`.
    fn error(&self, kind: LexErrorKind, start: Position) -> LexError {
        LexError {
            kind,
            span: Span::new(start, self.position()),
        }
    }

    /// The next token of the line, or `None` at its end or at a comment.
    fn token(&mut self) -> Result<Option<Token>, LexError> {
        match self.piece() {
            None | Some((Piece::Comment, _)) => Ok(None),
            Some((Piece::Token(kind), span)) => Ok(Some(Token { kind, span })),
            Some((Piece::Refused(error), _)) => Err(error),
        }
    }

    /// The next piece of the line with the stretch it takes, or `None` at the end of the
    /// line. Each piece is read whole, whatever is wrong in it, so that the reading can go
    /// on after it: [`classify_line`] reads a line that way, to its end.
    fn piece(&mut self) -> Option<(Piece, Span)> {
        while self.eat(' ') {}
        let start = self.position();
        let character = self.bump()?;
        let token = match character {
            '#' => {
                while self.bump().is_some() {}
                return Some((Piece::Comment, Span::new(start, self.position())));
            }
            '(' => Ok(TokenKind::LeftParen),
            ')' => Ok(TokenKind::RightParen),
            ',' => Ok(TokenKind::Comma),
            ':' => Ok(TokenKind::Colon),
            '+' => Ok(TokenKind::Plus),
            '-' => Ok(TokenKind::Minus),
            '*' => Ok(TokenKind::Star),
            '/' => Ok(TokenKind::Slash),
            '%' => Ok(TokenKind::Percent),
            '=' if self.eat('=') => Ok(TokenKind::EqualEqual),
            '=' => Ok(TokenKind::Equal),
            '!' if self.eat('=') => Ok(TokenKind::NotEqual),
            '<' if self.eat('=') => Ok(TokenKind::LessEqual),
            '<' => Ok(TokenKind::Less),
            '>' if self.eat('=') => Ok(TokenKind::GreaterEqual),
            '>' => Ok(TokenKind::Greater),
            '"' => self.text(start),
            '0'..='9' => self.number(character, start),
            _ if is_word(character) => Ok(keyword_or_name(self.word(character))),
            _ => {
                let kind = self.unexpected(character);
                Err(self.error(kind, start))
            }
        };
        let piece = token.map_or_else(Piece::Refused, Piece::Token);
        Some((piece, Span::new(start, self.position())))
    }

    /// The error for `character`, just read, which starts no token. A symbol of another
    /// language reads its second character, when it has one (`&&`, `||`).
    fn unexpected(&mut self, character: char) -> LexErrorKind {
        let symbol_for = |symbol, keyword| LexErrorKind::SymbolForKeyword { symbol, keyword };
        match character {
            '\t' => LexErrorKind::Tab,
            '\'' => LexErrorKind::SingleQuote,
            '!' => symbol_for("!", Keyword::Not),
            '&' if self.eat('&') => symbol_for("&&", Keyword::And),
            '&' => symbol_for("&", Keyword::And),
            '|' if self.eat('|') => symbol_for("||", Keyword::Or),
            '|' => symbol_for("|", Keyword::Or),
            _ => LexErrorKind::UnexpectedCharacter { character },
        }
    }

    /// The word that starts with `first`: letters, digits and underscores.
    fn word(&mut self, first: char) -> String {
        let mut word = String::from(first);
        while let Some(character) = self.bump_if(is_word) {
            word.push(character);
        }
        word
    }

    /// The number that starts with the digit `first`, from `start`.
    fn number(&mut self, first: char, start: Position) -> Result<TokenKind, LexError> {
        let word = self.word(first);
        if !word.chars().all(|character| character.is_ascii_digit()) {
            return Err(self.error(LexErrorKind::NameStartsWithDigit { word }, start));
        }
        word.parse()
            .map(TokenKind::Number)
            .map_err(|_| self.error(LexErrorKind::NumberTooLarge, start))
    }

    /// The text whose opening `"`, already read, is at `start`. It is read to its closing
    /// `"`, or to the end of the line, and the error is the first thing wrong in it.
    fn text(&mut self, start: Position) -> Result<TokenKind, LexError> {
        let mut text = String::new();
        let mut refused = None;
        loop {
            let escape = self.position();
            match self.bump() {
                Some('"') => return refused.map_or(Ok(TokenKind::Text(text)), Err),
                Some('\\') => match self.bump() {
                    Some('"') => text.push('"'),
                    Some('\\') => text.push('\\'),
                    Some('n') => text.push('\n'),
                    Some(character) => {
                        let kind = LexErrorKind::UnknownEscape { escape: character };
                        refused = refused.or_else(|| Some(self.error(kind, escape)));
                    }
                    None => break,
                },
                Some(character) => text.push(character),
                None => break,
            }
        }
        Err(refused.unwrap_or_else(|| self.error(LexErrorKind::UnclosedText, start)))
    }
}

/// What a [`Cursor`] reads at a place of a line.
enum Piece {
    /// A token.
    Token(TokenKind),
    /// A comment, from its `#` to the end of the line.
    Comment,
    /// Characters that make no token, with the first thing wrong in them.
    Refused(LexError),
}

/// Whether `character` can be part of a name: a letter, a digit or an underscore, in any
/// alphabet, so that the checker can tell the learner how to write `côté` or `paintSide`.
fn is_word(character: char) -> bool {
    character.is_alphanumeric() || character == '_'
}

/// The keyword or the name `word`.
fn keyword_or_name(word: String) -> TokenKind {
    Keyword::from_word(&word).map_or(TokenKind::Name(word), TokenKind::Keyword)
}

/// A count of lines or of characters as a position holds it, stopped at the largest number
/// it can hold.
fn saturating_u32(count: usize) -> u32 {
    u32::try_from(count).unwrap_or(u32::MAX)
}
