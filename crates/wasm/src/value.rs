//! The values of a program, for the interface (see *Values* in `specs.md`): what the variables
//! panel shows of a variable, and the types an error names.

use serde::Serialize;
use stepwise_core::interpreter;
use stepwise_core::lexer::text_literal;
use tsify::Tsify;

/// The most characters of a value that cross to the interface: more than the widest line of
/// the variables panel shows, which writes a value on one line and cuts it at its edge (see
/// *Variables panel* in `specs.md`). A text written in a program has no limit of length, and
/// several variables may hold it: the panel reads them at each frame.
pub const SHOWN_CHARACTERS: usize = 200;

/// The type of a value.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "kebab-case")]
pub enum ValueType {
    /// A whole number.
    Number,
    /// `true` or `false`.
    Boolean,
    /// A text.
    Text,
    /// A color of paint.
    Color,
}

/// A value: its type, and how it is written. A whole number crosses as its digits, since a
/// number of JavaScript doesn't hold the largest ones exactly, and nothing computes with it
/// on the other side.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[expect(
    clippy::struct_field_names,
    reason = "`type` is a word of Rust: the field of the type crosses under that name"
)]
pub struct Value {
    /// Its type, which tells the text `"3"` from the number 3 without reading the quotes.
    #[serde(rename = "type")]
    pub value_type: ValueType,
    /// The value as a program writes it (`-7`, `true`, `red`, a text between its quotes,
    /// with `\"`, `\\` and `\n`), its first [`SHOWN_CHARACTERS`] characters at most.
    pub text: String,
    /// Whether `text` is cut: the value is written with more characters.
    pub cut: bool,
}

impl From<interpreter::ValueType> for ValueType {
    fn from(value_type: interpreter::ValueType) -> Self {
        match value_type {
            interpreter::ValueType::Number => Self::Number,
            interpreter::ValueType::Boolean => Self::Boolean,
            interpreter::ValueType::Text => Self::Text,
            interpreter::ValueType::Color => Self::Color,
        }
    }
}

impl From<&interpreter::Value> for Value {
    fn from(value: &interpreter::Value) -> Self {
        let (text, cut) = match value {
            // A long text is written up to the characters shown, never whole.
            interpreter::Value::Text(text) => first_characters(text_literal(text)),
            // At most 20 characters: `-9223372036854775808`.
            other => (other.to_string(), false),
        };
        Self {
            value_type: value.value_type().into(),
            text,
            cut,
        }
    }
}

/// The first [`SHOWN_CHARACTERS`] of `characters`, and whether there were more.
fn first_characters(mut characters: impl Iterator<Item = char>) -> (String, bool) {
    let text: String = characters.by_ref().take(SHOWN_CHARACTERS).collect();
    (text, characters.next().is_some())
}

#[cfg(test)]
mod tests {
    use stepwise_core::color::Color;
    use stepwise_core::interpreter;

    use super::{SHOWN_CHARACTERS, Value, ValueType};

    fn value(value_type: ValueType, text: &str) -> Value {
        Value {
            value_type,
            text: text.to_owned(),
            cut: false,
        }
    }

    #[test]
    fn a_value_gives_its_type_and_how_a_program_writes_it() {
        use interpreter::Value as V;
        for (core, expected) in [
            (V::Number(-7), value(ValueType::Number, "-7")),
            (V::Boolean(true), value(ValueType::Boolean, "true")),
            (V::Boolean(false), value(ValueType::Boolean, "false")),
            (
                V::Text("côté 🤖".into()),
                value(ValueType::Text, "\"côté 🤖\""),
            ),
            (V::Text("".into()), value(ValueType::Text, "\"\"")),
            (V::Color(Color::Yellow), value(ValueType::Color, "yellow")),
        ] {
            assert_eq!(Value::from(&core), expected);
        }
    }

    #[test]
    fn a_text_is_written_with_its_escapes() {
        let text = interpreter::Value::Text("say \"hi\"\nC:\\".into());
        let expected = value(ValueType::Text, r#""say \"hi\"\nC:\\""#);
        assert_eq!(Value::from(&text), expected);
    }

    #[test]
    fn the_largest_numbers_keep_every_digit() {
        // Both are beyond the whole numbers JavaScript holds exactly (2^53).
        for (number, digits) in [
            (i64::MAX, "9223372036854775807"),
            (i64::MIN, "-9223372036854775808"),
        ] {
            let number = interpreter::Value::Number(number);
            assert_eq!(Value::from(&number), value(ValueType::Number, digits));
        }
    }

    #[test]
    fn a_text_that_reads_as_another_value_is_told_apart() {
        let text = interpreter::Value::Text("3".into());
        let number = interpreter::Value::Number(3);
        assert_eq!(Value::from(&text).text, "\"3\"");
        assert_eq!(Value::from(&number).text, "3");
        assert_ne!(
            Value::from(&text).value_type,
            Value::from(&number).value_type
        );
    }

    #[test]
    fn a_long_text_gives_its_first_characters_and_says_that_it_is_cut() {
        // With its quotes, the text is written with as many characters as are shown.
        let fits = "é".repeat(SHOWN_CHARACTERS - 2);
        let shown = Value::from(&interpreter::Value::Text(fits.as_str().into()));
        assert_eq!(shown, value(ValueType::Text, &format!("\"{fits}\"")));
        // One more, and the closing quote is left out; a hundred thousand, the same.
        for length in [SHOWN_CHARACTERS - 1, 100_000] {
            let shown = Value::from(&interpreter::Value::Text("é".repeat(length).into()));
            let expected = format!("\"{}", "é".repeat(SHOWN_CHARACTERS - 1));
            assert_eq!(shown.text, expected);
            assert_eq!(shown.text.chars().count(), SHOWN_CHARACTERS);
            assert!(shown.cut);
        }
    }

    #[test]
    fn an_escape_counts_as_the_characters_it_is_written_with() {
        let shown = Value::from(&interpreter::Value::Text(
            "\n".repeat(SHOWN_CHARACTERS).into(),
        ));
        let expected = format!("\"{}\\", "\\n".repeat((SHOWN_CHARACTERS - 2) / 2));
        assert_eq!(shown.text, expected);
        assert!(shown.cut);
    }
}
