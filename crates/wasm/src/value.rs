//! The values of a program, for the interface (see *Values* in `specs.md`): what the variables
//! panel shows of a variable, and the types an error names.

use serde::Serialize;
use stepwise_core::interpreter;
use tsify::Tsify;

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
pub struct Value {
    /// Its type, which decides how the interface draws it.
    #[serde(rename = "type")]
    pub value_type: ValueType,
    /// The value as `print` writes it: a text without its quotes, the others as they are
    /// written in a program (`-7`, `true`, `red`).
    pub text: String,
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
        Self {
            value_type: value.value_type().into(),
            text: value.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use stepwise_core::color::Color;
    use stepwise_core::interpreter;

    use super::{Value, ValueType};

    fn value(value_type: ValueType, text: &str) -> Value {
        Value {
            value_type,
            text: text.to_owned(),
        }
    }

    #[test]
    fn a_value_gives_its_type_and_how_print_writes_it() {
        use interpreter::Value as V;
        for (core, expected) in [
            (V::Number(-7), value(ValueType::Number, "-7")),
            (V::Boolean(true), value(ValueType::Boolean, "true")),
            (V::Boolean(false), value(ValueType::Boolean, "false")),
            (V::Text("côté 🤖".into()), value(ValueType::Text, "côté 🤖")),
            (V::Text("".into()), value(ValueType::Text, "")),
            (V::Color(Color::Yellow), value(ValueType::Color, "yellow")),
        ] {
            assert_eq!(Value::from(&core), expected);
        }
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
    fn a_text_that_reads_as_another_value_is_told_apart_by_its_type() {
        let text = interpreter::Value::Text("3".into());
        let number = interpreter::Value::Number(3);
        assert_eq!(Value::from(&text).text, Value::from(&number).text);
        assert_ne!(Value::from(&text), Value::from(&number));
    }
}
