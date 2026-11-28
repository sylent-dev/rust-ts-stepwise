//! Every level file of the website, read and checked as the core reads it, with its starting
//! code checked as a program is before it runs: a level that starts wrong is a bug of the
//! level. The list of the chapters names every level once, and only levels that have a file.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use stepwise_core::level::{Chapter, Chapters, Level, Sandbox, is_stable_name};
use stepwise_core::program::{Refused, check};

/// The folder of the level files, `web/levels/`.
fn levels_folder() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../web/levels")
}

/// The file of the chapters, in the folder of the levels: not a level.
const CHAPTERS: &str = "chapters";

/// The file of the sandbox, in the folder of the levels: not a level.
const SANDBOX: &str = "sandbox";

/// The name of a file without its folder nor its extension.
fn stem(file: &Path) -> &str {
    file.file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or_default()
}

/// The files of the folder of the levels, the sandbox and the chapters included, sorted by
/// name.
fn level_files() -> Vec<PathBuf> {
    let mut files: Vec<_> = fs::read_dir(levels_folder())
        .expect("the folder of the levels")
        .map(|entry| entry.expect("an entry of the folder").path())
        .filter(|path| {
            path.extension()
                .is_some_and(|extension| extension == "toml")
        })
        .collect();
    files.sort();
    files
}

/// The errors of the starting code, empty when it has none.
fn starting_code_errors(code: &str) -> Vec<String> {
    match check(code) {
        Ok(_) => Vec::new(),
        Err(Refused::Syntax(error)) => vec![format!("{error:?}")],
        Err(Refused::Check(errors)) => errors
            .into_iter()
            .map(|error| format!("{error:?}"))
            .collect(),
    }
}

#[test]
fn every_level_file_is_valid() {
    let files = level_files();
    assert!(
        files.iter().any(|file| file.ends_with("sandbox.toml")),
        "no sandbox.toml in {}",
        levels_folder().display()
    );
    let mut failures = Vec::new();
    for file in files.iter().filter(|file| stem(file) != CHAPTERS) {
        let name = stem(file);
        if !is_stable_name(name) {
            failures.push(format!("{name}: the name of a level is in kebab-case"));
        }
        let source = fs::read_to_string(file).expect("a level file");
        let starting_code = if name == SANDBOX {
            Sandbox::from_toml(&source).map(|sandbox| sandbox.starting_code().to_owned())
        } else {
            Level::from_toml(&source).map(|level| level.starting_code().to_owned())
        };
        match starting_code {
            Ok(code) => failures.extend(
                starting_code_errors(&code)
                    .into_iter()
                    .map(|error| format!("{name}: the starting code: {error}")),
            ),
            Err(error) => failures.push(format!("{name}: {error}")),
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}

#[test]
fn the_chapters_list_every_level_once() {
    let file = levels_folder().join(format!("{CHAPTERS}.toml"));
    let source = fs::read_to_string(&file).expect("the file of the chapters");
    let chapters = match Chapters::from_toml(&source) {
        Ok(chapters) => chapters,
        Err(error) => panic!("{}: {error}", file.display()),
    };
    // The list refuses a level listed twice: each name of it is one level.
    let listed: BTreeSet<&str> = chapters
        .chapters()
        .iter()
        .flat_map(Chapter::levels)
        .map(String::as_str)
        .collect();
    let files = level_files();
    let levels: BTreeSet<&str> = files
        .iter()
        .map(|file| stem(file))
        .filter(|name| *name != CHAPTERS && *name != SANDBOX)
        .collect();
    let without_file: Vec<_> = listed.difference(&levels).collect();
    let not_listed: Vec<_> = levels.difference(&listed).collect();
    assert!(
        without_file.is_empty(),
        "levels listed in {CHAPTERS}.toml without a file: {without_file:?}"
    );
    assert!(
        not_listed.is_empty(),
        "level files that {CHAPTERS}.toml doesn't list: {not_listed:?}"
    );
}

#[test]
fn a_starting_code_with_an_error_is_found() {
    assert_eq!(
        starting_code_errors("# Try anything here.\nforward()\n"),
        [""; 0]
    );
    assert_eq!(starting_code_errors("forward(\n").len(), 1);
    assert_eq!(starting_code_errors("x = 3\n").len(), 1);
}
