### What the levels say, in English: their texts, apart from the interface that shows them (see
### interface.ftl for the rule of the names).
###
### The family of the levels: the messages of a level are named after its stable name, the name of
### its file in `levels/`, and after the part of the level that they hold, `level-<name>-<part>`
### (`levelMessage`). No other message starts with `level-`. A new part is named by the same
### function: a family keeps one. The list of the parts (`LEVEL_PARTS`) holds what every level
### has, as its goal later; a part that a level may leave out, as its hint, is settled with the
### bubble of the goal (step 21c).
###
### The family of the chapters, the same way: `chapter-<name>-<part>` (`chapterMessage`), named
### after the stable name of the chapter in `levels/chapters.toml`, its parts in `CHAPTER_PARTS`.
###
### The chapters and the levels below are drafts, until the steps that design the levels (23 and
### 24) replace them.

## The chapters, in the order of the list.

chapter-paint-title = Paint
chapter-functions-title = Functions

## The titles of the levels, in the order of the list.

level-paint-a-square-title = Paint a square
level-a-red-line-title = A red line
level-two-squares-title = Two squares
level-the-staircase-title = The staircase
