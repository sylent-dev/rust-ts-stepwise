//! What the interface reads of the language at runtime, beside the unions of its words
//! (`word.rs`): what a table keyed by a word can't say. The command menu reads how many values
//! each built-in function takes, to insert its call with the cursor between its parentheses or
//! after them, and the editor checks the width of an indentation that it types.

use serde::Serialize;
use stepwise_core::{builtin, lexer};
use tsify::{Ts, Tsify};
use wasm_bindgen::JsError;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::count;
use crate::word::Builtin;

/// The lists of the language that the interface reads.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Vocabulary {
    /// Every built-in function, in the order of the specifications.
    pub builtins: Vec<BuiltinFunction>,
    /// The number of spaces that a block is indented by, more than the line that opens it.
    pub indent_width: u32,
}

/// A built-in function and the number of values that a call gives it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Tsify)]
pub struct BuiltinFunction {
    /// Its name, without its parentheses.
    pub name: Builtin,
    /// How many values a call gives it; nothing for `print`, which takes any number of them.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<u32>,
}

/// The lists of the language, built from those of the core, to call once the module has
/// loaded. A new object at each call.
///
/// # Errors
///
/// It throws when the lists can't be made a JavaScript object, which they never do.
#[wasm_bindgen]
pub fn vocabulary() -> Result<Ts<Vocabulary>, JsError> {
    Ok(Ts::from_rust(&lists())?)
}

/// The lists [`vocabulary`] gives, before they cross to JavaScript.
#[must_use]
pub fn lists() -> Vocabulary {
    Vocabulary {
        builtins: builtin::Builtin::ALL
            .into_iter()
            .map(|function| BuiltinFunction {
                name: function.into(),
                parameters: function.parameter_count().map(count),
            })
            .collect(),
        indent_width: lexer::INDENT_WIDTH,
    }
}

#[cfg(test)]
mod tests {
    use stepwise_core::builtin;

    use super::lists;
    use crate::word::Builtin;

    #[test]
    fn each_built_in_function_comes_with_its_number_of_values() {
        let functions = lists().builtins;
        assert_eq!(functions.len(), builtin::Builtin::ALL.len());
        for (function, word) in functions.into_iter().zip(builtin::Builtin::ALL) {
            assert_eq!(function.name, Builtin::from(word));
            assert_eq!(
                function.parameters.map(|count| count as usize),
                word.parameter_count(),
                "{word:?}"
            );
        }
    }

    #[test]
    fn print_takes_any_number_of_values_and_forward_none() {
        let functions = lists().builtins;
        let parameters = |name| {
            functions
                .iter()
                .find(|function| function.name == name)
                .map(|function| function.parameters)
        };
        assert_eq!(parameters(Builtin::Print), Some(None));
        assert_eq!(parameters(Builtin::Forward), Some(Some(0)));
        assert_eq!(parameters(Builtin::StartPainting), Some(Some(1)));
    }

    #[test]
    fn a_block_is_indented_by_four_spaces() {
        assert_eq!(lists().indent_width, 4);
    }
}
