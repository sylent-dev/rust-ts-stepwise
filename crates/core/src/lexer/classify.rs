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
    /// The name of a function: a built-in function wherever it is written, or any other name
    /// followed by a `(`, which is called or defined there.
    Function,
    /// Any other name: a variable, a parameter, a word of another language.
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
/// the lexer reads on it, the blank characters left out.
///
/// It never fails, and gives nothing for an empty line. The stretches follow each other
/// without overlapping, and each holds one character at least.
#[must_use]
pub fn classify_line(line: &str) -> Vec<Stretch> {
    let mut cursor = Cursor::new(line, 1);
    // Blank characters of any kind before the first piece, as the lexer skips them before a
    // comment.
    while cursor.bump_if(char::is_whitespace).is_some() {}
    let mut pieces = Vec::new();
    while let Some(piece) = cursor.piece() {
        pieces.push(piece);
    }

    let mut stretches = Vec::with_capacity(pieces.len());
    let mut following = pieces.iter().map(|(piece, _)| piece).skip(1);
    for (piece, span) in &pieces {
        let called = matches!(following.next(), Some(Piece::Token(TokenKind::LeftParen)));
        stretches.push(Stretch {
            kind: kind_of(piece, called),
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

/// What a name is: the reserved words first, which stay what they are wherever they are
/// written, then a name followed by a `(`.
fn name_kind(name: &str, called: bool) -> StretchKind {
    if Builtin::from_word(name).is_some() {
        StretchKind::Function
    } else if Color::from_word(name).is_some() {
        StretchKind::Color
    } else if called {
        StretchKind::Function
    } else {
        StretchKind::Name
    }
}

#[cfg(test)]
mod tests {
    use super::StretchKind::{
        Boolean, Color, Comment, Function, Invalid, Keyword, Name, Number, Symbol, Text,
    };
    use super::{Stretch, StretchKind, classify_line};
    use crate::lexer::{TokenKind, tokenize};
    use crate::test_support::Random;

    /// The stretches of `line`, each as what it is and its characters.
    fn read(line: &str) -> Vec<(StretchKind, String)> {
        let characters: Vec<char> = line.chars().collect();
        classify_line(line)
            .into_iter()
            .map(|stretch| {
                let start = usize::try_from(stretch.start).unwrap() - 1;
                let end = usize::try_from(stretch.end).unwrap() - 1;
                (stretch.kind, characters[start..end].iter().collect())
            })
            .collect()
    }

    /// Checks that `line` is read as `expected`, each stretch as what it is and its
    /// characters.
    #[track_caller]
    fn assert_read(line: &str, expected: &[(StretchKind, &str)]) {
        let expected: Vec<(StretchKind, String)> = expected
            .iter()
            .map(|&(kind, text)| (kind, text.to_owned()))
            .collect();
        assert_eq!(read(line), expected, "in {line:?}");
    }

    #[test]
    fn the_words_of_the_language_are_told_apart() {
        assert_read(
            "let sides = 0",
            &[
                (Keyword, "let"),
                (Name, "sides"),
                (Symbol, "="),
                (Number, "0"),
            ],
        );
        assert_read(
            "while not done and sides < 4:",
            &[
                (Keyword, "while"),
                (Keyword, "not"),
                (Name, "done"),
                (Keyword, "and"),
                (Name, "sides"),
                (Symbol, "<"),
                (Number, "4"),
                (Symbol, ":"),
            ],
        );
        assert_read(
            "    start_painting(red)",
            &[
                (Function, "start_painting"),
                (Symbol, "("),
                (Color, "red"),
                (Symbol, ")"),
            ],
        );
    }

    #[test]
    fn true_and_false_are_values_rather_than_keywords() {
        assert_read(
            "let done = true or false",
            &[
                (Keyword, "let"),
                (Name, "done"),
                (Symbol, "="),
                (Boolean, "true"),
                (Keyword, "or"),
                (Boolean, "false"),
            ],
        );
    }

    #[test]
    fn a_name_followed_by_a_parenthesis_is_a_function() {
        assert_read(
            "function paint_side(length):",
            &[
                (Keyword, "function"),
                (Function, "paint_side"),
                (Symbol, "("),
                (Name, "length"),
                (Symbol, ")"),
                (Symbol, ":"),
            ],
        );
        // The spaces before the parenthesis don't count, and the name alone is a name: the
        // line doesn't say what a name is elsewhere in the program.
        assert_read(
            "paint_side (3)",
            &[
                (Function, "paint_side"),
                (Symbol, "("),
                (Number, "3"),
                (Symbol, ")"),
            ],
        );
        assert_read("paint_side", &[(Name, "paint_side")]);
    }

    #[test]
    fn a_reserved_word_stays_what_it_is_wherever_it_is_written() {
        // A built-in function without its parentheses, a color called as a function.
        assert_read("forward", &[(Function, "forward")]);
        assert_read(
            "let forward = red()",
            &[
                (Keyword, "let"),
                (Function, "forward"),
                (Symbol, "="),
                (Color, "red"),
                (Symbol, "("),
                (Symbol, ")"),
            ],
        );
    }

    #[test]
    fn a_word_of_another_language_is_a_name() {
        assert_read(
            "elif sides:",
            &[(Name, "elif"), (Name, "sides"), (Symbol, ":")],
        );
        assert_read(
            "def square():",
            &[
                (Name, "def"),
                (Function, "square"),
                (Symbol, "("),
                (Symbol, ")"),
                (Symbol, ":"),
            ],
        );
    }

    #[test]
    fn every_symbol_is_read_whole() {
        assert_read(
            "a == b != c <= d >= e < f > g",
            &[
                (Name, "a"),
                (Symbol, "=="),
                (Name, "b"),
                (Symbol, "!="),
                (Name, "c"),
                (Symbol, "<="),
                (Name, "d"),
                (Symbol, ">="),
                (Name, "e"),
                (Symbol, "<"),
                (Name, "f"),
                (Symbol, ">"),
                (Name, "g"),
            ],
        );
        assert_read(
            "(1+2-3*4/5%6,7)",
            &[
                (Symbol, "("),
                (Number, "1"),
                (Symbol, "+"),
                (Number, "2"),
                (Symbol, "-"),
                (Number, "3"),
                (Symbol, "*"),
                (Number, "4"),
                (Symbol, "/"),
                (Number, "5"),
                (Symbol, "%"),
                (Number, "6"),
                (Symbol, ","),
                (Number, "7"),
                (Symbol, ")"),
            ],
        );
    }

    #[test]
    fn a_comment_runs_to_the_end_of_its_line() {
        assert_read(
            "# Paint a square of side 3",
            &[(Comment, "# Paint a square of side 3")],
        );
        assert_read(
            "        # \"not a text\", not a (call)",
            &[(Comment, "# \"not a text\", not a (call)")],
        );
        assert_read(
            "forward() # one step",
            &[
                (Function, "forward"),
                (Symbol, "("),
                (Symbol, ")"),
                (Comment, "# one step"),
            ],
        );
    }

    #[test]
    fn a_text_holds_what_would_be_code_elsewhere() {
        assert_read(
            r#"print("I am # stuck", "say \"hi\" (now)\n")"#,
            &[
                (Function, "print"),
                (Symbol, "("),
                (Text, r#""I am # stuck""#),
                (Symbol, ","),
                (Text, r#""say \"hi\" (now)\n""#),
                (Symbol, ")"),
            ],
        );
    }

    #[test]
    fn a_text_not_closed_yet_runs_to_the_end_of_its_line() {
        assert_read(
            r#"print("I am stu"#,
            &[(Function, "print"), (Symbol, "("), (Text, r#""I am stu"#)],
        );
        // What follows on the line is in the text: its comment, its closing parenthesis.
        assert_read(
            r#"print("stuck) # why"#,
            &[
                (Function, "print"),
                (Symbol, "("),
                (Text, r#""stuck) # why"#),
            ],
        );
        // A `\` at the end of the line, and one before the last quote, which it escapes.
        assert_read(r#""stuck\"#, &[(Text, r#""stuck\"#)]);
        assert_read(r#""stuck\""#, &[(Text, r#""stuck\""#)]);
    }

    #[test]
    fn a_text_with_an_escape_the_language_does_not_have_stays_a_text() {
        assert_read(
            r#"print("a\tb", 3)"#,
            &[
                (Function, "print"),
                (Symbol, "("),
                (Text, r#""a\tb""#),
                (Symbol, ","),
                (Number, "3"),
                (Symbol, ")"),
            ],
        );
    }

    #[test]
    fn a_number_too_large_stays_a_number() {
        assert_read(
            "let big = 99999999999999999999",
            &[
                (Keyword, "let"),
                (Name, "big"),
                (Symbol, "="),
                (Number, "99999999999999999999"),
            ],
        );
    }

    #[test]
    fn what_the_language_does_not_read_is_invalid_and_the_line_goes_on() {
        assert_read(
            "let a = 'x' ; forward()",
            &[
                (Keyword, "let"),
                (Name, "a"),
                (Symbol, "="),
                (Invalid, "'"),
                (Name, "x"),
                (Invalid, "'"),
                (Invalid, ";"),
                (Function, "forward"),
                (Symbol, "("),
                (Symbol, ")"),
            ],
        );
        assert_read(
            "if a && !b || c:",
            &[
                (Keyword, "if"),
                (Name, "a"),
                (Invalid, "&&"),
                (Invalid, "!"),
                (Name, "b"),
                (Invalid, "||"),
                (Name, "c"),
                (Symbol, ":"),
            ],
        );
        assert_read(
            "let 2nd_side = 1.5",
            &[
                (Keyword, "let"),
                (Invalid, "2nd_side"),
                (Symbol, "="),
                (Number, "1"),
                (Invalid, "."),
                (Number, "5"),
            ],
        );
    }

    #[test]
    fn the_blank_characters_are_left_out() {
        assert_eq!(classify_line(""), []);
        assert_eq!(classify_line("        "), []);
        assert_eq!(classify_line(" \t\u{a0} "), []);
        // Tabs and a non-breaking space before the first piece are skipped as its spaces
        // are; between two pieces, they are characters that the language doesn't read.
        assert_read(
            "\t\u{a0}forward()",
            &[(Function, "forward"), (Symbol, "("), (Symbol, ")")],
        );
        assert_read("let\ta", &[(Keyword, "let"), (Invalid, "\t"), (Name, "a")]);
    }

    #[test]
    fn the_columns_count_characters_from_1() {
        assert_eq!(
            classify_line("    let côté = \"🤖\" # é"),
            [
                (Keyword, 5, 8),
                (Name, 9, 13),
                (Symbol, 14, 15),
                (Text, 16, 19),
                (Comment, 20, 23),
            ]
            .map(|(kind, start, end)| Stretch { kind, start, end })
        );
    }

    /// Lines of every kind, right and wrong, to read in any order.
    const PIECES: [&str; 24] = [
        "let sides = 0",
        "sides = sides + 1",
        "while sides < 4:",
        "repeat 3:",
        "if front_is_clear() and not here_is(red):",
        "else if left_is(blue) or done == false:",
        "else:",
        "function paint_side(length, color):",
        "return (length - 1) * 2 / 3 % 4",
        "break",
        "start_painting(yellow)",
        "print(\"Sides:\", sides, \"say \\\"hi\\\"\\n\")",
        "forward() # one step",
        "# a comment alone",
        "",
        "let côté = \"🤖\"",
        "print(\"not closed",
        "print(\"a\\tb\")",
        "let a = 'x' ; b",
        "if a && !b || c:",
        "let 2nd = 99999999999999999999",
        "elif\tx != y >= z <= w > v",
        "a.b @ c \\ d",
        "\"\\",
    ];

    #[test]
    fn the_stretches_follow_each_other_inside_the_line() {
        let mut random = Random(11);
        for _ in 0..5_000 {
            // Whole lines, and lines cut anywhere, as while they are typed.
            let whole = format!("{} {}", random.pick(&PIECES), random.pick(&PIECES));
            let length = whole.chars().count();
            let line: String = whole.chars().take(random.next() % (length + 1)).collect();
            let end = u32::try_from(line.chars().count()).unwrap() + 1;
            let mut after = 1;
            for stretch in classify_line(&line) {
                assert!(
                    after <= stretch.start && stretch.start < stretch.end && stretch.end <= end,
                    "{stretch:?} after the column {after} in {line:?}"
                );
                after = stretch.end;
            }
        }
    }

    #[test]
    fn a_line_cut_anywhere_keeps_what_is_before_its_last_stretch() {
        // While a line is typed, only its last stretch changes: nothing before it flickers.
        // But for a name that becomes a function once its parenthesis is typed.
        for whole in PIECES {
            let full = read(whole);
            let length = whole.chars().count();
            for cut in 0..length {
                let line: String = whole.chars().take(cut).collect();
                let mut partial = read(&line);
                partial.pop();
                for (index, (kind, text)) in partial.iter().enumerate() {
                    let (full_kind, full_text) = &full[index];
                    assert_eq!(text, full_text, "{line:?} of {whole:?}");
                    let becomes_function = *kind == Name && *full_kind == Function;
                    assert!(
                        kind == full_kind || becomes_function,
                        "{text:?} is {kind:?} in {line:?} and {full_kind:?} in {whole:?}"
                    );
                }
            }
        }
    }

    /// The same rules read a source and color it: the stretches of each line of a source
    /// that the lexer accepts are its tokens, and its comments.
    #[test]
    fn the_stretches_of_a_line_are_the_tokens_the_lexer_reads_on_it() {
        let valid: Vec<&str> = PIECES[..16].to_vec();
        let mut random = Random(7);
        let mut compared = 0;
        for _ in 0..2_000 {
            let source = random.program(&valid);
            let Ok(lexed) = tokenize(&source) else {
                continue;
            };
            let mut tokens = lexed
                .tokens
                .iter()
                .filter(|token| {
                    !matches!(
                        token.kind,
                        TokenKind::Newline | TokenKind::Indent | TokenKind::Dedent | TokenKind::End
                    )
                })
                .peekable();
            for (number, line) in (1..).zip(source.split('\n')) {
                let mut columns = Vec::new();
                while let Some(token) = tokens.next_if(|token| token.span.start.line == number) {
                    columns.push((token.span.start.column, token.span.end.column));
                }
                let read: Vec<(u32, u32)> = classify_line(line)
                    .into_iter()
                    .filter(|stretch| stretch.kind != Comment)
                    .map(|stretch| (stretch.start, stretch.end))
                    .collect();
                assert_eq!(read, columns, "in {line:?}");
                compared += 1;
            }
        }
        assert!(compared > 5_000, "only {compared} lines compared");
    }
}
