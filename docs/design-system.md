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
| `--passed` | `#5fd0b0` | The teal of the item, what has passed: a level done, a map passed, the status bar once a map has passed, the progress under the header. It is the only color of what has passed: a green of its own for the progress and the console was rejected, two greens side by side that didn't go together (decided on 2026-11-16). |
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
| `--passed-text` | `#09795f` | `#5fd0b0` | The teal as a text: *Map 1 passed* in the console, a code that opens a level, the level done of the success panel. |

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

## Typography

Three fonts, each with one role, and a few sizes, weights and line heights, each with a role too, so that a new screen picks one of them instead of adding its own. The section *Typography* of the mock-up shows each token with its samples. The files of the fonts and their licenses are in [Font sources](font-sources.md).

### Names

- The kind of value first, then its role: `--font-<role>`, `--size-<role>`, `--weight-<role>`, `--line-<role>`.
- A size names what the text is (a label, a title), never its place in the scale: `--size-title`, not `--size-5`.
- A text takes its four values from the tokens: `font: var(--weight-strong) var(--size-title)/var(--line-title) var(--font-text)`.

### Fonts

| Token | Font | Role |
|---|---|---|
| `--font-name` | Fredoka | The personality, kept rare so that it keeps its effect: the name, what the robot says, **Let's go**, the great moments. Always in `--weight-strong`. |
| `--font-text` | Manrope | The interface: everything that is read or clicked. |
| `--font-code` | Source Code Pro | The code: the editor, the console, the variables panel, the command menu, the examples of the manual. Never with ligatures (`font-variant-ligatures: none`). |

- Each is followed by its generic family (`sans-serif`, `monospace`), for the characters its file doesn't have.
- One file per font, with every weight, in `web/static/fonts/`. The page preloads the three files and waits for them (`font-display: block`): a text never shows in another font first, which would move the code of the editor and the name beside the logo.
- Code is never set in Manrope, which draws `->` and `--` as one sign.
- An arrow or a check mark is an icon, never a character: the files don't have them.

### Sizes

In pixels, as the whole layout: the zoom of the browser scales them together.

| Token | Value | Role |
|---|---|---|
| `--size-label` | `11px` | The title of a group, in capitals: the chapter above the name of a level, *New*, a group of shortcuts or of results. |
| `--size-small` | `12.5px` | What comes second: the status bar, a shortcut beside its command, a sentence under a name. |
| `--size-text` | `13.5px` | The text of the interface: the menus, the tabs, the buttons, the sentences. |
| `--size-lead` | `15px` | What is read at length (the manual, a message in place of the screen), what names a zone (the level, a chapter), a large button. |
| `--size-title` | `18px` | The title of a panel or of a goal, a question, **Let's go**, the level chosen on the home screen, a section of the manual, the words used by a level done. |
| `--size-display` | `27px` | The title of a page, a great moment. |
| `--size-code` | `14px` | The code: the editor, the list of the command menu, the examples of the manual. |
| `--size-code-small` | `13px` | The code in the denser panels: the console, the variables, an example of the command menu. |

- The name `stepwise` isn't on the scale: its size goes with the logo (see [Look of the world](../specs.md#look-of-the-world)), 21 pixels in the header.
- Two sizes follow the text around them: the numbers of the lines of the editor, at 0.88 em of its code, and a piece of code within a sentence, at 0.92 em, so that its letters are as tall as those of Manrope.
- The scale replaces the 23 sizes of the mock-up, each text sized on its own (decided on 2026-11-16, compared on every window of the mock-up). Rejected: a scale of 10 that kept 16.5 and 21 pixels beside 18, three titles too close to tell apart.

### Weights

| Token | Value | Role |
|---|---|---|
| `--weight-text` | `400` | What is read: a sentence, a shortcut, the status bar. |
| `--weight-control` | `500` | What is clicked: a menu, a tab, a small button; the link of the manual where the reader is. |
| `--weight-strong` | `600` | What stands out: a title, a title in capitals, a main button, what is chosen or shown, a word of a sentence. The only weight of Fredoka. |
| `--weight-code` | `600` | The code. |
| `--weight-code-strong` | `800` | The code that stands out: the name of a command, the number of the line of the next step, a value that has just changed, the call in progress. |

- Rejected (decided on 2026-11-16): a bold (700) for two titles in capitals and the sections of the manual, an extra-bold (800) for the number of the level to play, a medium (500) for the one sentence of the robot in the manual, each hardly told from the semi-bold.

### Line heights

| Token | Value | Role |
|---|---|---|
| `--line-title` | `1.25` | A title, a name that may take two lines, a row of the legend. |
| `--line-text` | `1.4` | The text of the interface. |
| `--line-reading` | `1.6` | What is read at length: the manual, a message in place of the screen. |
| `--line-code` | `21px` | The code of the editor, of the command menu and of the examples of the manual. |
| `--line-code-small` | `20px` | The code of the denser panels. |

- The code has whole pixels, so that the marks of its lines (the next step, an error, a value that has just changed) fall on the pixels.
- A text of one line centered in its box has a line height of `1`: the name, a menu, the number of a level.
- Two blocks keep heights of their own, part of their layout: the place of the level in the header (13 and 18 pixels) and the rows of the calls in progress (22 pixels).
- They replace a dozen values written one text at a time (decided on 2026-11-16): a text moved by 1 to 4 pixels.

### Other rules

| Token | Value | Role |
|---|---|---|
| `--tracking-label` | `.05em` | The spacing of the letters of a title in capitals. |

- **Figures of one width** (`font-variant-numeric: tabular-nums`) where a number changes in place: the status bar, whose steps count up while a program runs, and the size of the window in the message that asks for a larger one. The code already has them.

## Spacing

One scale of eight steps for every distance, so that a new screen picks a step instead of adding a value of its own. The section *Spacing* of the mock-up draws each step at its real length.

### Names

- `--space-<length>`: a step is named by its length in pixels, where the other tokens name a role. A distance has no role of its own, the same 12 pixels border a band and separate two paragraphs, and the name says at once what is written.
- A row that goes past its text on both sides takes a step back: `margin: 0 calc(-1 * var(--space-6))`.

### Scale

In pixels, as the whole layout.

| Token | Value | Role |
|---|---|---|
| `--space-2` | `2px` | The parts of one control: the menus of the header, the two values of a choice, the squares of the speed; a dense row, in the command menu and the legend; a sentence under its name. |
| `--space-4` | `4px` | A small row or a small button, above and under its text: a tab, a section of the manual, a shortcut; two tabs side by side. |
| `--space-6` | `6px` | A button and a row of a menu, above and under their text; an icon and its word; a cross and its corner. |
| `--space-8` | `8px` | Two neighbors: two buttons, two messages of the console, a title and its sentence; a field and its text; a bubble and what it names. |
| `--space-12` | `12px` | The sides of a band and of its rows: the header, the status bar, a row of a menu, the code after its margin; two paragraphs. |
| `--space-16` | `16px` | The sides of a panel and of what opens over the screen: the console, the goal, the legend, the level chosen on the home screen, the side of the manual. |
| `--space-24` | `24px` | The sides of a panel in the middle of the screen: the settings, the shortcuts, a confirmation, the success panel; two groups in a row. |
| `--space-40` | `40px` | The margins of a page that is read, the manual, and what separates two of its sections. |

- Every padding, margin and gap takes a step, and so does the distance of a floating element from the edge it hangs on: the three controls from the corner of the editor, a cross from its corner, a bubble from its button.
- A panel that starts with a title has one step less above it than on its sides (12 above 16, 16 above 24): the line of the title already brings room over its letters.
- A small button and a tab have 4 pixels above and under their text and 12 on their sides; a button, 6 and 16; a row of a menu, 6 and 12. The two values of a choice, 4 pixels inside a track of 2, are as tall as a button.
- The sizes aren't on the scale: the heights of the bands, the widths of the columns and of the panels, and the places that follow them (the bubble of the goal under its button) belong to the layout of each block.
- The scale replaces the 34 values of the mock-up, each written by hand (decided on 2026-11-16, compared on every window of the mock-up): 170 of the 295 distances moved, most by 1 or 2 pixels, the page of the manual by 10. Left out: 10, 14, 18 and 22 pixels, the most used after 8 and 12, too close to their neighbors for a new screen to tell which to pick.

### Exceptions

The alignments tuned by eye keep their value, written in their block with its reason:

- The header and the name of the manual keep 3 pixels under their content, the height of the bar of the progress, above which the content is centered.
- A link of the goal has 4.5 pixels above its text and 5.5 under it: the text sits half a pixel high, tuned on the owner's screen.
- The icon of a note of the console sits 3 pixels lower, on the lowercase letters of its line.
- The robot of a goal moves 2 pixels to the left in Night Desk, where its dark outline fades into the bubble.
- *On this page* starts 4 pixels lower than the page of the manual, on the capitals of its title.
- A stone and the robot of the home screen are placed by their center, and the caret of the editor by its middle: half their size, not a step.
- What the robot says in the manual keeps distances in `em`, which follow the size of its text.
