//! The tests of the names at a place, the cursor written `|` in each source.

use super::{NamesAt, ProgramFunction, ProgramVariable, names_at};
use crate::checker;
use crate::parser::{SyntaxError, parse, parse_up_to};
use crate::span::Position;
use crate::test_support::{Random, span};

/// The names at the `|` of `marked`, which holds one, in the source without it.
#[track_caller]
fn at(marked: &str) -> Result<NamesAt, SyntaxError> {
    let (before, _) = marked.split_once('|').expect("a cursor");
    let line = before.matches('\n').count() + 1;
    let column = before.rsplit('\n').next().unwrap().chars().count() + 1;
    let cursor = Position::new(line.try_into().unwrap(), column.try_into().unwrap());
    names_at(&marked.replacen('|', "", 1), cursor)
}

/// The names of the functions and of the variables at the `|` of `marked`.
#[track_caller]
fn names(marked: &str) -> (Vec<String>, Vec<String>) {
    let found = at(marked).unwrap();
    (
        found
            .functions
            .into_iter()
            .map(|function| function.name)
            .collect(),
        found
            .variables
            .into_iter()
            .map(|variable| variable.name)
            .collect(),
    )
}

#[track_caller]
fn variables(marked: &str) -> Vec<String> {
    names(marked).1
}

#[track_caller]
fn functions(marked: &str) -> Vec<String> {
    names(marked).0
}

fn function(name: &str, parameters: &[&str], line: u32) -> ProgramFunction {
    let start = 10;
    let end = start + u32::try_from(name.len()).unwrap();
    ProgramFunction {
        name: name.to_owned(),
        parameters: parameters
            .iter()
            .map(|&parameter| parameter.to_owned())
            .collect(),
        defined: span(line, start, end),
    }
}

mod scopes {
    use super::*;

    #[test]
    fn the_main_program_uses_the_variables_declared_above_the_cursor() {
        assert_eq!(
            variables("let a = 1\nlet b = 2\n|\nlet c = 3\n"),
            ["a", "b"]
        );
    }

    #[test]
    fn the_variables_come_in_the_order_of_the_source() {
        let source = "let zeta = 1\nlet alpha = 2\nlet mid = 3\nlet beta = 4\n|";
        assert_eq!(variables(source), ["zeta", "alpha", "mid", "beta"]);
    }

    #[test]
    fn a_function_is_used_under_its_definition_and_in_its_own_body() {
        let source = "function first():\n    forward()\nfunction second(a, b):\n    |\n\
                      function third():\n    forward()\n";
        assert_eq!(
            at(source).unwrap().functions,
            [
                function("first", &[], 1),
                function("second", &["a", "b"], 3)
            ]
        );
    }

    #[test]
    fn a_function_sees_its_parameters_and_its_variables_never_those_of_the_main_program() {
        let source = "let total = 0\nfunction paint_side(length):\n    let done = 0\n    |\n\
                      let after = 1\n";
        assert_eq!(
            at(source).unwrap(),
            NamesAt {
                functions: vec![function("paint_side", &["length"], 2)],
                variables: vec![
                    ProgramVariable {
                        name: "length".to_owned(),
                        declared: span(2, 21, 27),
                        parameter_of: Some("paint_side".to_owned()),
                    },
                    ProgramVariable {
                        name: "done".to_owned(),
                        declared: span(3, 9, 13),
                        parameter_of: None,
                    },
                ],
            }
        );
    }

    #[test]
    fn the_main_program_under_a_function_sees_its_own_variables_again() {
        let source = "let a = 1\nfunction f(b):\n    let c = 2\nlet d = 3\n|";
        assert_eq!(
            names(source),
            (vec!["f".to_owned()], vec!["a".to_owned(), "d".to_owned()])
        );
    }

    #[test]
    fn the_variables_of_the_blocks_open_at_the_cursor_are_there() {
        let source =
            "let a = 1\nif true:\n    let b = 2\n    while true:\n        let c = 3\n        |";
        assert_eq!(variables(source), ["a", "b", "c"]);
    }

    #[test]
    fn the_variables_of_a_block_that_has_ended_are_gone() {
        let source = "repeat 2:\n    let inside = 1\nlet outside = 2\n|";
        assert_eq!(variables(source), ["outside"]);
        let source = "if true:\n    let a = 1\nelse:\n    let b = 2\n    |";
        assert_eq!(variables(source), ["b"]);
    }

    #[test]
    fn a_name_that_the_checks_refuse_is_no_variable() {
        // A color, the name of a function, and a second `let` of the same name.
        let source =
            "function f():\n    forward()\nlet red = 1\nlet f = 2\nlet a = 1\nlet a = 2\n|";
        let found = at(source).unwrap();
        assert_eq!(found.variables.len(), 1);
        assert_eq!(found.variables[0].name, "a");
        assert_eq!(found.variables[0].declared, span(5, 5, 6));
    }

    #[test]
    fn a_parameter_written_twice_is_one_variable() {
        assert_eq!(variables("function f(a, a):\n    |"), ["a"]);
    }

    #[test]
    fn a_function_written_in_a_function_leaves_it_its_parameters() {
        let found = at("function f(a):\n    function g(b):\n        forward()\n    |").unwrap();
        assert_eq!(found.functions.len(), 2);
        assert_eq!(found.variables.len(), 1);
        assert_eq!(found.variables[0].parameter_of.as_deref(), Some("f"));
    }

    #[test]
    fn a_function_written_in_a_block_is_listed_and_a_second_of_its_name_is_not() {
        let source =
            "if true:\n    function g():\n        forward()\nfunction g():\n    forward()\n|";
        let found = at(source).unwrap();
        assert_eq!(found.functions.len(), 1);
        assert_eq!(found.functions[0].defined.start.line, 2);
    }

    #[test]
    fn a_name_refused_for_its_form_is_still_a_variable() {
        assert_eq!(variables("let Sides = 0\n|"), ["Sides"]);
    }

    #[test]
    fn a_function_named_as_a_built_in_function_is_no_function() {
        assert_eq!(
            functions("function forward():\n    turn_left()\n|"),
            [] as [&str; 0]
        );
    }

    #[test]
    fn nothing_is_declared_above_the_first_line() {
        assert_eq!(at("|").unwrap(), NamesAt::default());
        assert_eq!(at("|let a = 1\n").unwrap(), NamesAt::default());
    }

    #[test]
    fn a_cursor_under_the_last_line_reads_every_line() {
        let found = names_at("let a = 1", Position::new(3, 1)).unwrap();
        assert_eq!(found.variables.len(), 1);
    }
}

mod line_of_the_cursor {
    use super::*;

    #[test]
    fn what_the_line_of_the_cursor_holds_is_never_read() {
        // A `let` being written: its name doesn't exist yet, and its syntax is wrong.
        assert_eq!(variables("let sides = 4\nlet total = |"), ["sides"]);
        assert_eq!(variables("let sides = 4\nsid|"), ["sides"]);
        assert_eq!(variables("let sides = 4\nprint(|  # (\n"), ["sides"]);
    }

    #[test]
    fn the_lines_under_the_cursor_are_never_read() {
        assert_eq!(variables("let a = 1\n|\nforward(\n\tlet b = 2\n"), ["a"]);
    }

    #[test]
    fn a_syntax_error_above_the_cursor_hides_the_names() {
        let Err(SyntaxError::Parse(error)) = at("let a = 1\nforward(\n|") else {
            panic!("the line 2 should be refused");
        };
        assert_eq!(error.span.start.line, 2);
        assert!(matches!(at("\tlet a = 1\n|"), Err(SyntaxError::Lex(_))));
    }

    #[test]
    fn it_goes_into_the_block_that_the_line_above_opens_whatever_its_indentation() {
        for marked in [
            "function f(a):\n    |",
            "function f(a):\n|",
            "function f(a):\n        |",
            "function f(a):  # Paints\n\n    # A comment\n|",
        ] {
            assert_eq!(variables(marked), ["a"], "in {marked:?}");
        }
    }

    #[test]
    fn it_leaves_the_blocks_that_its_indentation_closes() {
        let source = "let a = 1\nrepeat 2:\n    let b = 2\n    repeat 3:\n        let c = 3\n";
        assert_eq!(variables(&format!("{source}|")), ["a"]);
        assert_eq!(variables(&format!("{source}    |")), ["a", "b"]);
        assert_eq!(variables(&format!("{source}        |")), ["a", "b", "c"]);
    }

    #[test]
    fn an_indentation_that_the_language_refuses_goes_to_the_block_where_it_could_be() {
        let source = "let a = 1\nrepeat 2:\n    let b = 2\n";
        // Deeper than the block open, which the line above doesn't open: in that block.
        assert_eq!(variables(&format!("{source}            |")), ["a", "b"]);
        assert_eq!(variables("let a = 1\nprint(\"a:\")\n    |"), ["a"]);
        // Between two blocks: the outer one.
        assert_eq!(variables(&format!("{source}  |")), ["a"]);
    }

    #[test]
    fn its_indentation_is_counted_up_to_the_cursor() {
        let source = "let a = 1\nrepeat 2:\n    let b = 2\n";
        assert_eq!(variables(&format!("{source}|    ")), ["a"]);
        assert_eq!(variables(&format!("{source}    |    ")), ["a", "b"]);
        assert_eq!(variables(&format!("{source}    paint|")), ["a", "b"]);
    }
}

mod robustness {
    use super::*;

    /// Asserts that the names at `cursor` in `source` are read, and that the walk reaches the
    /// stand-in of the line of the cursor.
    #[track_caller]
    fn assert_read(source: &str, cursor: Position) {
        let program = parse_up_to(source, cursor);
        assert!(program.is_ok(), "at {cursor:?} in {source:?}: {program:?}");
        let program = program.unwrap();
        assert!(
            checker::names_at(&program, cursor.line).is_some(),
            "the walk misses the line {} of {source:?}",
            cursor.line
        );
    }

    #[test]
    fn a_program_that_reads_gives_its_names_wherever_the_cursor_is() {
        let pieces = [
            "let sides = 0",
            "forward()",
            "sides = sides + 1",
            "if sides == 0:",
            "else if sides == 1:",
            "else:",
            "while true:",
            "repeat 2:",
            "function walk(side):",
            "function run():",
            "# A comment",
            "",
            "break",
            "return sides",
        ];
        let mut random = Random(11);
        let mut read = 0;
        for _ in 0..2000 {
            let source = random.program(&pieces);
            if parse(&source).is_err() {
                continue;
            }
            read += 1;
            let lines: Vec<&str> = source.split('\n').collect();
            for (line, text) in (1..).zip(&lines) {
                for column in 1..=text.chars().count() + 2 {
                    assert_read(&source, Position::new(line, column.try_into().unwrap()));
                }
            }
            // Under the last line, every function of the program is listed.
            let under = Position::new(u32::try_from(lines.len()).unwrap() + 1, 1);
            assert_read(&source, under);
            let functions = names_at(&source, under).unwrap().functions.len();
            let defined = ["function walk(", "function run("]
                .into_iter()
                .filter(|definition| source.contains(definition))
                .count();
            assert_eq!(functions, defined, "in {source:?}");
        }
        assert!(read > 300, "only {read} programs could be read");
    }
}
