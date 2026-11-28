//! The order of the levels and their chapters (see *Levels and progression* in `specs.md`): one
//! list, each chapter with its levels in their order, each named by its stable name. The rules
//! of the list are checked here, without knowing its file.

use std::collections::HashSet;

/// A chapter: its stable name, and its levels in their order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Chapter {
    name: String,
    levels: Vec<String>,
}

impl Chapter {
    /// A chapter named `name`, whose levels are `levels`, in their order. The list of the
    /// chapters checks them ([`Chapters::new`]).
    #[must_use]
    pub(super) const fn new(name: String, levels: Vec<String>) -> Self {
        Self { name, levels }
    }

    /// Its stable name: the name of its messages.
    #[must_use]
    pub fn name(&self) -> &str {
        &self.name
    }

    /// The stable names of its levels, in their order: the names of their files.
    #[must_use]
    pub fn levels(&self) -> &[String] {
        &self.levels
    }
}

/// The chapters of the game, in their order, each with its levels: the numbers of the levels
/// follow this order, across the chapters.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Chapters(Vec<Chapter>);

/// Why a list of chapters can't be.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChaptersError {
    /// No chapter at all.
    NoChapter,
    /// A chapter without a level: it would be a band without a stone on the home screen.
    EmptyChapter(String),
    /// A name that isn't a stable name ([`is_stable_name`]), of a chapter or of a level.
    Name(String),
    /// The same chapter twice.
    DuplicateChapter(String),
    /// The same level twice, in one chapter or in two: it would have two numbers.
    DuplicateLevel(String),
}

impl Chapters {
    /// The chapters `chapters`, in their order, once their rules are checked.
    ///
    /// # Errors
    ///
    /// When there is no chapter, a chapter has no level, a name isn't a stable name, or a
    /// chapter or a level comes twice: the first one met, in the order of the list.
    pub(super) fn new(chapters: Vec<Chapter>) -> Result<Self, ChaptersError> {
        if chapters.is_empty() {
            return Err(ChaptersError::NoChapter);
        }
        let mut chapter_names = HashSet::new();
        let mut level_names = HashSet::new();
        for chapter in &chapters {
            let name = chapter.name();
            if !is_stable_name(name) {
                return Err(ChaptersError::Name(name.to_owned()));
            }
            if !chapter_names.insert(name) {
                return Err(ChaptersError::DuplicateChapter(name.to_owned()));
            }
            if chapter.levels.is_empty() {
                return Err(ChaptersError::EmptyChapter(name.to_owned()));
            }
            for level in chapter.levels() {
                if !is_stable_name(level) {
                    return Err(ChaptersError::Name(level.clone()));
                }
                if !level_names.insert(level.as_str()) {
                    return Err(ChaptersError::DuplicateLevel(level.clone()));
                }
            }
        }
        Ok(Self(chapters))
    }

    /// The chapters, in their order.
    #[must_use]
    pub fn chapters(&self) -> &[Chapter] {
        &self.0
    }
}

/// Whether `name` is a stable name, of a level or of a chapter: in kebab-case, lowercase ASCII
/// letters and digits in words joined by single hyphens (`paint-a-square`). It names a file, the
/// messages of its texts and what is saved for it.
#[must_use]
pub fn is_stable_name(name: &str) -> bool {
    !name.is_empty()
        && !name.starts_with('-')
        && !name.ends_with('-')
        && !name.contains("--")
        && name.chars().all(|character| {
            character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-'
        })
}

#[cfg(test)]
mod tests {
    use super::{Chapters, ChaptersError, is_stable_name};
    use crate::level::{LevelError, LevelErrorKind};

    /// A file of chapters with these chapters, each the body of a `[[chapters]]` table.
    fn source(chapters: &[&str]) -> String {
        let mut source = String::from("version = 1\n");
        for chapter in chapters {
            source.push_str("\n[[chapters]]\n");
            source.push_str(chapter);
        }
        source
    }

    /// The error of a file of chapters, which is about the file as a whole.
    #[track_caller]
    fn error(source: &str) -> LevelErrorKind {
        let error = Chapters::from_toml(source).unwrap_err();
        assert_eq!(error.map, None, "{error}");
        error.kind
    }

    /// The error of the rules of a list of chapters.
    #[track_caller]
    fn chapters_error(chapters: &[&str]) -> ChaptersError {
        match error(&source(chapters)) {
            LevelErrorKind::Chapters(error) => error,
            other => panic!("an error of the chapters, not {other:?}"),
        }
    }

    #[test]
    fn the_chapters_keep_their_order_and_the_order_of_their_levels() {
        let chapters = Chapters::from_toml(&source(&[
            "name = 'paint'\nlevels = ['paint-a-square', 'a-red-line']",
            "name = 'functions'\nlevels = ['two-squares']",
        ]))
        .unwrap();
        let read: Vec<_> = chapters
            .chapters()
            .iter()
            .map(|chapter| (chapter.name(), chapter.levels()))
            .collect();
        assert_eq!(
            read,
            [
                (
                    "paint",
                    &["paint-a-square".to_owned(), "a-red-line".to_owned()][..]
                ),
                ("functions", &["two-squares".to_owned()][..]),
            ]
        );
    }

    #[test]
    fn a_list_without_a_chapter_is_refused() {
        assert_eq!(
            error("version = 1\nchapters = []\n"),
            LevelErrorKind::Chapters(ChaptersError::NoChapter)
        );
    }

    #[test]
    fn a_chapter_without_a_level_is_refused() {
        assert_eq!(
            chapters_error(&["name = 'paint'\nlevels = []"]),
            ChaptersError::EmptyChapter("paint".to_owned())
        );
    }

    #[test]
    fn a_name_that_is_not_a_stable_name_is_refused() {
        assert_eq!(
            chapters_error(&["name = 'First steps'\nlevels = ['a']"]),
            ChaptersError::Name("First steps".to_owned())
        );
        assert_eq!(
            chapters_error(&["name = 'paint'\nlevels = ['paint_a_square']"]),
            ChaptersError::Name("paint_a_square".to_owned())
        );
    }

    #[test]
    fn a_chapter_or_a_level_listed_twice_is_refused() {
        assert_eq!(
            chapters_error(&[
                "name = 'paint'\nlevels = ['a']",
                "name = 'paint'\nlevels = ['b']"
            ]),
            ChaptersError::DuplicateChapter("paint".to_owned())
        );
        assert_eq!(
            chapters_error(&["name = 'paint'\nlevels = ['a', 'b', 'a']"]),
            ChaptersError::DuplicateLevel("a".to_owned())
        );
        assert_eq!(
            chapters_error(&[
                "name = 'paint'\nlevels = ['a']",
                "name = 'repeat'\nlevels = ['a']"
            ]),
            ChaptersError::DuplicateLevel("a".to_owned())
        );
    }

    #[test]
    fn a_file_of_another_version_or_with_a_field_unknown_is_refused() {
        assert_eq!(
            error("version = 2\n[[chapters]]\nname = 'paint'\nlevels = ['a']\n"),
            LevelErrorKind::Version(2)
        );
        assert!(matches!(
            error(&source(&[
                "name = 'paint'\nlevels = ['a']\nidea = 'the brush'"
            ])),
            LevelErrorKind::Syntax(_)
        ));
    }

    #[test]
    fn each_error_of_the_chapters_has_its_sentence() {
        let sentence = |error: ChaptersError| LevelError::file(error.into()).to_string();
        assert_eq!(
            sentence(ChaptersError::NoChapter),
            "the list has no chapter"
        );
        assert_eq!(
            sentence(ChaptersError::EmptyChapter("paint".to_owned())),
            "the chapter `paint` has no level"
        );
        assert_eq!(
            sentence(ChaptersError::Name("Paint".to_owned())),
            "`Paint` is not in kebab-case, as the name of a chapter or of a level is"
        );
        assert_eq!(
            sentence(ChaptersError::DuplicateChapter("paint".to_owned())),
            "the chapter `paint` is listed twice"
        );
        assert_eq!(
            sentence(ChaptersError::DuplicateLevel("a".to_owned())),
            "the level `a` is listed twice"
        );
    }

    #[test]
    fn a_stable_name_is_in_kebab_case() {
        for name in ["sandbox", "paint-a-square", "level-2"] {
            assert!(is_stable_name(name), "{name}");
        }
        for name in [
            "",
            "Paint",
            "paint_a_square",
            "-paint",
            "paint-",
            "paint--a",
            "carré",
        ] {
            assert!(!is_stable_name(name), "{name}");
        }
    }
}
