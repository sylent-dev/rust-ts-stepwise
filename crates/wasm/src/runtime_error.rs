//! The errors of a program while it runs, for the interface (see *Error handling* in
//! `specs.md`): each a code with its values and its place, as the errors of the checks before
//! running (`check.rs`).

use serde::Serialize;
use stepwise_core::interpreter::{self, MAX_CALL_DEPTH, MAX_TEXT_LENGTH};
use stepwise_core::world::RobotError;
use tsify::Tsify;

use crate::count;
use crate::position::{Offsets, Span};
use crate::value::ValueType;
use crate::word;

/// An error that stopped a program while it ran, as the core gives it: where it is, and what
/// went wrong there.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
pub struct RuntimeError {
    /// The stretch of the source to show: its line is the one marked in the editor.
    pub span: Span,
    /// What went wrong there: its `code`, and the values its message needs.
    pub kind: RuntimeErrorKind,
}

/// What stopped a program while it ran: a `code`, and the values its message needs
/// (`{ code: "no-value", function: "forward" }`).
///
/// Each variant is the error of the same name in the core, where it is described: those of
/// `RuntimeErrorKind`, the ones of the robot (`RobotError`) among them, each with its own
/// code. No code is one of the checks before running (`ProgramErrorKind`). An operator and a
/// function are given as they are written, a built-in function that the error can only come
/// from by its type (`word.rs`), a whole number of the program as its digits (see `Value`),
/// and a limit of the language with the error that it stops.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[serde(
    tag = "code",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum RuntimeErrorKind {
    // The values a statement or an operator refuses.
    ConditionNotBoolean {
        found: ValueType,
    },
    RepeatCountNotNumber {
        found: ValueType,
    },
    NegativeRepeatCount {
        count: String,
    },
    UnaryOperand {
        operator: String,
        found: ValueType,
    },
    BinaryOperands {
        operator: String,
        left: ValueType,
        right: ValueType,
    },
    LogicOperand {
        operator: String,
        found: ValueType,
    },
    DivisionByZero,
    Overflow,
    TextTooLong {
        limit: u32,
    },

    // The calls.
    NoValue {
        function: String,
    },
    TooManyCalls {
        function: String,
        limit: u32,
    },

    // What the robot can't do.
    Bump,
    AlreadyCarrying,
    NoItemHere,
    NotCarrying,
    ItemAlreadyHere,
    ValueNotColor {
        function: word::Builtin,
        found: ValueType,
    },

    // What `print` can't write.
    LineTooLong {
        limit: u32,
    },

    // A mistake of the core.
    Internal,
}

impl RuntimeError {
    /// The error `error` of a program whose source has the lines of `offsets`.
    #[must_use]
    pub fn new(error: &interpreter::RuntimeError, offsets: &Offsets) -> Self {
        Self {
            span: offsets.span(error.span),
            kind: RuntimeErrorKind::new(&error.kind),
        }
    }
}

impl RuntimeErrorKind {
    fn new(kind: &interpreter::RuntimeErrorKind) -> Self {
        use interpreter::RuntimeErrorKind as K;
        match *kind {
            K::ConditionNotBoolean { found } => Self::ConditionNotBoolean {
                found: found.into(),
            },
            K::RepeatCountNotNumber { found } => Self::RepeatCountNotNumber {
                found: found.into(),
            },
            K::NegativeRepeatCount { count } => Self::NegativeRepeatCount {
                count: count.to_string(),
            },
            K::UnaryOperand { operator, found } => Self::UnaryOperand {
                operator: operator.as_str().to_owned(),
                found: found.into(),
            },
            K::BinaryOperands {
                operator,
                left,
                right,
            } => Self::BinaryOperands {
                operator: operator.as_str().to_owned(),
                left: left.into(),
                right: right.into(),
            },
            K::LogicOperand { operator, found } => Self::LogicOperand {
                operator: operator.as_str().to_owned(),
                found: found.into(),
            },
            K::DivisionByZero => Self::DivisionByZero,
            K::Overflow => Self::Overflow,
            K::TextTooLong => Self::TextTooLong {
                limit: count(MAX_TEXT_LENGTH),
            },
            K::NoValue { ref function } => Self::NoValue {
                function: function.clone(),
            },
            K::TooManyCalls { ref function } => Self::TooManyCalls {
                function: function.clone(),
                limit: count(MAX_CALL_DEPTH),
            },
            K::Robot(error) => match error {
                RobotError::Bump => Self::Bump,
                RobotError::AlreadyCarrying => Self::AlreadyCarrying,
                RobotError::NoItemHere => Self::NoItemHere,
                RobotError::NotCarrying => Self::NotCarrying,
                RobotError::ItemAlreadyHere => Self::ItemAlreadyHere,
            },
            K::ValueNotColor { function, found } => Self::ValueNotColor {
                function: function.into(),
                found: found.into(),
            },
            K::LineTooLong => Self::LineTooLong {
                limit: count(MAX_TEXT_LENGTH),
            },
            K::Internal => Self::Internal,
        }
    }
}

#[cfg(test)]
mod tests {
    use stepwise_core::builtin::Builtin;
    use stepwise_core::interpreter::{self, BinaryOperator, RuntimeErrorKind as K, UnaryOperator};
    use stepwise_core::span::{self, Position};
    use stepwise_core::world::RobotError;

    use super::{RuntimeError, RuntimeErrorKind as B};
    use crate::position::{Offsets, Span};
    use crate::value::ValueType;
    use crate::word;

    fn function(name: &str) -> String {
        name.to_owned()
    }

    #[test]
    fn the_errors_of_values_keep_their_names_their_types_and_their_operators() {
        use interpreter::ValueType as T;
        let written = str::to_owned;
        for (core, expected) in [
            (
                K::ConditionNotBoolean { found: T::Number },
                B::ConditionNotBoolean {
                    found: ValueType::Number,
                },
            ),
            (
                K::RepeatCountNotNumber { found: T::Text },
                B::RepeatCountNotNumber {
                    found: ValueType::Text,
                },
            ),
            (
                K::NegativeRepeatCount { count: -3 },
                B::NegativeRepeatCount {
                    count: written("-3"),
                },
            ),
            (
                K::UnaryOperand {
                    operator: UnaryOperator::Negate,
                    found: T::Text,
                },
                B::UnaryOperand {
                    operator: written("-"),
                    found: ValueType::Text,
                },
            ),
            (
                K::UnaryOperand {
                    operator: UnaryOperator::Not,
                    found: T::Number,
                },
                B::UnaryOperand {
                    operator: written("not"),
                    found: ValueType::Number,
                },
            ),
            (
                K::BinaryOperands {
                    operator: BinaryOperator::LessEqual,
                    left: T::Boolean,
                    right: T::Color,
                },
                B::BinaryOperands {
                    operator: written("<="),
                    left: ValueType::Boolean,
                    right: ValueType::Color,
                },
            ),
            (
                K::LogicOperand {
                    operator: BinaryOperator::Or,
                    found: T::Color,
                },
                B::LogicOperand {
                    operator: written("or"),
                    found: ValueType::Color,
                },
            ),
            (K::DivisionByZero, B::DivisionByZero),
            (K::Overflow, B::Overflow),
            (K::TextTooLong, B::TextTooLong { limit: 1_000 }),
        ] {
            assert_eq!(B::new(&core), expected);
        }
    }

    #[test]
    fn the_errors_of_calls_and_of_the_robot_keep_their_names_and_their_functions() {
        for (core, expected) in [
            (
                K::NoValue {
                    function: function("forward"),
                },
                B::NoValue {
                    function: function("forward"),
                },
            ),
            (
                K::TooManyCalls {
                    function: function("paint_side"),
                },
                B::TooManyCalls {
                    function: function("paint_side"),
                    limit: 200,
                },
            ),
            (K::Robot(RobotError::Bump), B::Bump),
            (K::Robot(RobotError::AlreadyCarrying), B::AlreadyCarrying),
            (K::Robot(RobotError::NoItemHere), B::NoItemHere),
            (K::Robot(RobotError::NotCarrying), B::NotCarrying),
            (K::Robot(RobotError::ItemAlreadyHere), B::ItemAlreadyHere),
            (
                K::ValueNotColor {
                    function: Builtin::StartPainting,
                    found: interpreter::ValueType::Number,
                },
                B::ValueNotColor {
                    function: word::Builtin::StartPainting,
                    found: ValueType::Number,
                },
            ),
            (K::LineTooLong, B::LineTooLong { limit: 1_000 }),
            (K::Internal, B::Internal),
        ] {
            assert_eq!(B::new(&core), expected);
        }
    }

    #[test]
    fn a_count_below_zero_keeps_every_digit() {
        let count = i64::MIN;
        assert_eq!(
            B::new(&K::NegativeRepeatCount { count }),
            B::NegativeRepeatCount {
                count: "-9223372036854775808".to_owned()
            }
        );
    }

    #[test]
    fn an_error_is_placed_in_the_source_as_javascript_counts_it() {
        // `1 / 0` after an emoji, which is one character for the core and two units here.
        let source = "let côté = \"🤖\"\nprint(\"🤖\", 1 / 0)\n";
        let error = interpreter::RuntimeError {
            kind: K::DivisionByZero,
            span: span::Span::new(Position::new(2, 12), Position::new(2, 17)),
        };
        assert_eq!(
            RuntimeError::new(&error, &Offsets::new(source)),
            RuntimeError {
                span: Span {
                    line: 2,
                    from: 28,
                    to: 33
                },
                kind: B::DivisionByZero,
            }
        );
    }
}
