//! The names that a line written at the cursor may use, for the interface (see *Command menu*
//! in `specs.md`): what the command menu lists under **Your names**. The place of each name
//! is given too: the menu shows its line, and Ctrl+click on a function will go to it.

use serde::Serialize;
use stepwise_core::lexer::LexError;
use stepwise_core::names;
use stepwise_core::parser::{ParseError, SyntaxError};
use tsify::{Ts, Tsify};
use wasm_bindgen::JsError;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::position::{Offsets, Span};

/// The names that a line written at the cursor may use, or the line of the syntax error that
/// hides them (`{ kind: "hidden", line: 3 }`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum NamesAt {
    /// The names, each list in the order of the source.
    Names {
        /// The functions of the program defined above the cursor, the one whose body holds it
        /// included.
        functions: Vec<ProgramFunction>,
        /// The variables that exist at the cursor: in a function, its parameters and its own
        /// variables; in the main program, its variables.
        variables: Vec<ProgramVariable>,
    },
    /// A syntax error above the cursor, on `line`, hides them.
    Hidden { line: u32 },
}

/// A function of the program.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
pub struct ProgramFunction {
    pub name: String,
    /// Its parameters, as written.
    pub parameters: Vec<String>,
    /// Where its name is in its definition.
    pub defined: Span,
}

/// A variable of the program.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct ProgramVariable {
    pub name: String,
    /// Where its name is in its `let`, or among the parameters of its function.
    pub declared: Span,
    /// The name of the function whose parameter it is; nothing for a variable of a `let`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameter_of: Option<String>,
}

/// The names that a line written at the cursor may use, `cursor` being its offset in `source`
/// as the editor counts it, in UTF-16 code units. Only the lines above the cursor are read, and
/// nothing of its own line: the line being written.
///
/// # Errors
///
/// It throws when the names can't be made a JavaScript object, which they never do.
#[wasm_bindgen(js_name = namesAt)]
pub fn names_at(source: &str, cursor: u32) -> Result<Ts<NamesAt>, JsError> {
    Ok(Ts::from_rust(&names(source, cursor))?)
}

/// The names [`names_at`] gives, before they cross to JavaScript.
#[must_use]
pub fn names(source: &str, cursor: u32) -> NamesAt {
    let offsets = Offsets::new(source);
    match names::names_at(source, offsets.position(cursor)) {
        Ok(found) => NamesAt::Names {
            functions: found
                .functions
                .into_iter()
                .map(|function| ProgramFunction {
                    name: function.name,
                    parameters: function.parameters,
                    defined: offsets.span(function.defined),
                })
                .collect(),
            variables: found
                .variables
                .into_iter()
                .map(|variable| ProgramVariable {
                    name: variable.name,
                    declared: offsets.span(variable.declared),
                    parameter_of: variable.parameter_of,
                })
                .collect(),
        },
        Err(
            SyntaxError::Lex(LexError { span, .. }) | SyntaxError::Parse(ParseError { span, .. }),
        ) => NamesAt::Hidden {
            line: span.start.line,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::{NamesAt, ProgramFunction, ProgramVariable, names};
    use crate::position::Span;

    /// The offset of the `|` of `marked`, and the source without it.
    fn at(marked: &str) -> NamesAt {
        let (before, _) = marked.split_once('|').unwrap();
        let cursor = u32::try_from(before.encode_utf16().count()).unwrap();
        names(&marked.replacen('|', "", 1), cursor)
    }

    #[test]
    fn each_name_comes_with_its_place_in_the_text_of_the_editor() {
        // The emoji takes two units: the places after it are counted as the editor counts.
        let source = "print(\"🤖\")\nfunction paint_side(length):\n    let côté = 1\n    |";
        assert_eq!(
            at(source),
            NamesAt::Names {
                functions: vec![ProgramFunction {
                    name: "paint_side".to_owned(),
                    parameters: vec!["length".to_owned()],
                    defined: Span {
                        line: 2,
                        from: 21,
                        to: 31
                    },
                }],
                variables: vec![
                    ProgramVariable {
                        name: "length".to_owned(),
                        declared: Span {
                            line: 2,
                            from: 32,
                            to: 38
                        },
                        parameter_of: Some("paint_side".to_owned()),
                    },
                    ProgramVariable {
                        name: "côté".to_owned(),
                        declared: Span {
                            line: 3,
                            from: 49,
                            to: 53
                        },
                        parameter_of: None,
                    },
                ],
            }
        );
    }

    #[test]
    fn the_cursor_is_found_after_a_wide_character_on_its_line() {
        // `print("🤖")` is set aside: a stand-in for the line of the cursor, in its block.
        let found = at("function f(a):\n    print(\"🤖\")|\nlet b = 1\n");
        let NamesAt::Names { variables, .. } = found else {
            panic!("the names should be read: {found:?}");
        };
        assert_eq!(variables.len(), 1);
    }

    #[test]
    fn a_syntax_error_above_the_cursor_gives_its_line() {
        assert_eq!(at("let a = 1\nforward(\n|"), NamesAt::Hidden { line: 2 });
        assert_eq!(at("let a = 1\n\tforward()\n|"), NamesAt::Hidden { line: 2 });
    }
}
