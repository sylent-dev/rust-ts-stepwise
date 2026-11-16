# Design system

The visual choices of the interface, written once as named tokens, so that the application and its future screens stay consistent. The principles they follow are in [specs.md](../specs.md#design-principles).

- The mock-up, [`docs/mockups/interface.html`](mockups/interface.html), is the reference of the interface. Its file [`docs/mockups/interface/themes.css`](mockups/interface/themes.css) holds exactly these tokens, as CSS variables, and its blocks use nothing else.
- The application implements them in one module, so that a color changes in one place.
- The map isn't part of it: its shades are those of [Look of the world](../specs.md#look-of-the-world), the same in both themes.

## Colors

Two themes, chosen in the settings: **Day Desk**, light, by default, and **Night Desk**, dark. The zones of a screen meet without any line, each in its own tone; color is kept for what carries a meaning.

### Names

- A token names a role, never a shade: `--error`, not `--red`.
- `--on-<role>` is the text and the icons drawn on the fill `<role>`.
- `--<role>-soft` is the pale tone of a role, a background under the text of the page.
- `--<role>-hover` is the role under the pointer.
- `--<role>-text` is the role as a text on a zone, when its fill can't be read as a text there.
- A token that both themes share is written once.
- A part of the interface with tones of its own keeps them under its name: `--code-…`, `--goal-…`, `--home-…`.

### Shared by both themes

| Token | Value | Role |
|---|---|---|
| `--accent` | `#ffb300` | The amber of the yellow paint, what to do: the main button of a screen (**Let's go**, **Play**), **Run**, the path of the home screen, the state *Paused*; and where the learner is on a page (the line of *On this page*, the thumb of a scroll bar). |
| `--accent-hover` | `#ffd25e` | A main button under the pointer. |
| `--on-accent-weak` | `#3a4250` | A quiet icon on the amber: the magnifier of the search. |
| `--new` | `#3fc3ff` | The cyan of the eyes of the robot, what is new: the title *New* of a goal, the dot of **Legend**, the label *New* of the legend. |
| `--passed` | `#5fd0b0` | The teal of the item, what has passed: a level done, a map passed. |
| `--on-passed` | `#222935` | The text on the teal, the ink of the world. |
| `--passed-soft` | `--passed` at 28 % over `--band` | The tab of a map that has passed, on the level screen and on the home screen. |
| `--danger` | `#dc2f34` | The red of the paint: **Clear all progress** as it fills. |
| `--on-danger` | `#ffffff` | The text on it. |
| `--chosen` | `--text` | What is chosen in a list is filled with the color of the text: the theme in the settings, a command, a result of the search. |
| `--veil` | `#0007` | The veil over the screen under a panel. |
| `--shade` | `#0001` | A light shade under the pointer, on a colored zone: the **×** of the banner. |
| `--drawer-shadow` | `-12px 0 34px #22293530` | The shadow of the drawer of the manual on the screen. |
| `--goal-link` | `#5d687a` | A link of the goal (**Show hint**, **Read the manual**), the slate of the walls. |
| `--goal-link-hover` | `#6b778a` | The same under the pointer. |
| `--on-goal-link`, `--on-goal-side` | `#ffffff` | The text on a link of the goal, and on its dark side. |
| `--robot-body`, `--robot-ink`, `--robot-eyes` | `#ffffff`, `#222935`, `#3fc3ff` | The shades of the robot, where the interface draws its face: the level to play on the home screen, the map shown. |

### Zones

| Token | Day Desk | Night Desk | Role |
|---|---|---|---|
| `--app-bg` | `#c9d0d9` | `#39424f` | The window, behind its blocks. |
| `--band` | `#eceff3` | `#171b21` | The header, the status bar, the rows of tabs, the sides of the manual and its examples of code. |
| `--band-hover` | `#dde2e8` | `#2a313b` | A button of a band under the pointer. |
| `--surface` | `#fafbfc` | `#1e232b` | The editor and the content of a screen. |
| `--hover` | `#e4e8ed` | `#333b47` | A row under the pointer, on a surface or in what opens over the screen; a thin line between two rows; the track of a scroll bar. |
| `--map-block` | `#d3d8df` | `#262c35` | The block around the map, darker than the map in Day Desk so that it stands out. |
| `--map-shadow` | `0 8px 26px #22293540` | `0 10px 34px #0008` | The shadow of the map on its block. |
| `--field` | `#e4e8ee` | `#14181e` | A field to type in: the search of the manual, the code of a level. |
| `--pop` | `#ffffff` | `#272e38` | What opens over the screen: a menu, a bubble, a panel. |
| `--pop-border` | `1px solid #c3cad3` | `1px solid #434d5c` | Its edge. |
| `--pop-shadow` | `0 14px 40px #22293540` | `0 14px 40px #0009` | Its shadow. |

### Texts

| Token | Day Desk | Night Desk | Role |
|---|---|---|---|
| `--text` | `#1b2028` | `#e8ecf1` | Everything that is read, the code included. |
| `--weak` | `#5c6675` | `#98a3b2` | What comes second: a sentence under a title, a tab that isn't shown, a shortcut. |
| `--on-status` | `#4f5968` | `#a7b1bf` | The text of the status bar. |
| `--gutter-text` | `#939daa` | `#677282` | The line numbers. |

### Controls

| Token | Day Desk | Night Desk | Role |
|---|---|---|---|
| `--control` | `#ffffff` | `#2f3641` | The controls that float over the editor, **Step** and **Reset**; the main one, **Run** or **Pause**, is in amber. |
| `--control-shadow` | `0 1px 5px #22293538` | `0 2px 8px #0006` | Their shadow, the one of a main button too. |
| `--chip` | `#e3e7ec` | `#2f3641` | A small button with a text (**Legend**, a map of the home screen), the track of a choice between two values. |
| `--on-chosen` | `#f6f7f9` | `#171b21` | The text on `--chosen`. |
| `--chosen-soft` | `#d3d9e1` | `#2f3641` | The quiet tone of what is shown or pointed: the tab shown, the section open in the manual, the category chosen in the command menu, the call in progress, a message of the console under the pointer. |
| `--idle` | `#c3cad3` | `#4b5564` | A map not passed yet, under a level of the home screen. |
| `--progress-track` | `#dde2e8` | `#2a313b` | The track of the progress, under the header. |

### States

| Token | Day Desk | Night Desk | Role |
|---|---|---|---|
| `--on-accent` | `#1b2028` | `#171b21` | The text on the amber. |
| `--accent-soft` | `#fff0c7` | `#4a3c17` | A warning that isn't an error: the banner of the storage; a variable that has just changed. |
| `--accent-text` | `#8a5a00` | `#ffb300` | The amber as a text: the state in the status bar, the mark of the next line in the margin. |
| `--mark` | `#ffe9ad` | `#4a3c17` | The flash of the place reached in the manual. |
| `--error` | `#bf2f3a` | `#ff7b7b` | An error: its line in the console, its underline, the status bar once a run has failed. |
| `--on-error` | `#ffffff` | `#171b21` | The text on it. |
| `--error-soft` | `#fbe5e6` | `#47262c` | The line of an error in the editor. |
| `--success` | `#14906a` | `#46c98f` | The progress under the header, *Map 1 passed* in the console. |
| `--passed-text` | `#09795f` | `#5fd0b0` | The teal as a text: a code that opens a level, the level done of the success panel. |

### Editor and code

| Token | Day Desk | Night Desk | Role |
|---|---|---|---|
| `--current` | `#ffe9ad` | `#413a23` | The line of the next step. |
| `--breakpoint` | `#cf3a44` | `#ff7b7b` | A breakpoint in the margin. |
| `--select` | `#bcd4f5` | `#3a5274` | The selection. |
| `--code-comment` | `#6e7a8a` | `#8490a0` | A comment. |
| `--code-keyword` | `#2d5cc2` | `#8fb8ff` | A word of the language: `if`, `while`, `function`, `let`. |
| `--code-function` | `#09795f` | `#68d8bb` | The name of a function, built-in or defined by the learner. |
| `--code-string` | `#8f5f06` | `#ffd27a` | A text between quotes. |
| `--code-number` | `#b34c1c` | `#ffa98a` | A number, `true`, `false`, a color. |

### Goal and home screen

| Token | Day Desk | Night Desk | Role |
|---|---|---|---|
| `--goal-side` | `#222935` | `#12161c` | The dark side of a goal, which lists what is new; dark in both themes, so that the cyan reads on it. |
| `--goal-bubble` | `#eceff3` | `#1d222a` | The bubble of the title of a goal, said by the robot. |
| `--home-ground` | `#e1e5ea` | `#262c35` | The ground under the path of the levels: the floor of the map in Day Desk. |
| `--home-line` | `#cad1da` | `#36404d` | Its grid, drawn at half strength. |
| `--home-five` | `#22293520` | `#ffffff14` | Its line every five cells. |
| `--home-band` | `#ffffff8c` | `#1e232bd9` | The band of a chapter, which lets the ground show through. |
| `--home-rim` | `#f1f3f6` | `#20252d` | The solid edge that detaches a level and its maps from the path. |
| `--home-tile-shown` | `#cdd4dc` | `#465060` | The map shown, among the maps of a level in its panel. |
| `--home-locked` | `#eceff3` | `#2a303a` | A map of a level that is locked, in its panel. |
| `--home-locked-stone` | `#dadee4` | `#363d49` | A level that is locked, on the path. |

### Keyboard focus

| Token | Value | Role |
|---|---|---|
| `--focus-ring` | `2px solid currentColor` | The ring of the element that holds the focus of the keyboard, shown for the keys only (`:focus-visible`), never after a click. |
| `--focus-offset` | `-4px` | Its place: 4 pixels inside the edge of the element. |

- In the color of the text of its element, the ring stands out on every fill without a rule per element: dark on the amber of **Let's go**, light on the theme chosen in the settings, white on the dark side of a goal.
- Inside the edge, no zone cuts it: the zones meet without any line, and many buttons lie against the edge of theirs (the tabs of the map, **Legend**, **Let's go**).
- A field and the editor show their cursor instead.
- Rejected (decided on 2026-11-16, section *Keyboard focus* of the mock-up): a ring around the element, 2 pixels away, in the color of the text of the page, cut on the buttons that lie against an edge and lost on the dark side of a goal in Day Desk; the cyan and the amber, weak on the light zones of Day Desk, the amber lost on an amber button, and both already carrying a meaning.

### Contrast

The contrast between a text and its zone hasn't been checked against a rule: see the [backlog](backlog.md) (set aside on 2026-11-16).
