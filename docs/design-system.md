# Design system

The visual choices of the interface, written once as named tokens, so that the application and its future screens stay consistent. The principles they follow are in [specs.md](../specs.md#design-principles).

- The mock-up, [`docs/mockups/interface.html`](mockups/interface.html), is the reference of the interface. Its blocks use nothing else than these tokens.
- The tokens are CSS variables, written once, in the application: [`web/src/lib/styles/tokens.css`](../web/src/lib/styles/tokens.css) imports one file per kind (`colors.css`, `typography.css`, `spacing.css` with the radii, `motion.css`). The mock-up loads that same file, as it loads the fonts, so that a value changes in one place and the two never drift apart (decided on 2026-11-17).
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
| `--hover` | `#e4e8ed` | `#333b47` | A row under the pointer, on a surface or in what opens over the screen; in a menu, the row chosen with the keys and the row of the screen already shown, lit as if already chosen; a thin line between two rows; the track of a scroll bar. |
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

- The three underlines of the editor differ by their shape, and not only by their color: a wave in `--error` under an error, a thin line in `--text` under the name pointed with Ctrl held, dots in `--weak` under the end of a line past 80 characters.
- The wave stays under an error (decided on 2026-11-17, compared in tabs of the mock-up): an error is what must catch the eye first, the wave is read without its color, and the learner finds it in every code editor. Rejected: squares and dots, read as the dots of a long line but for their color; dashes, which say *more on hover* as on a web page; a straight line, too close to the one of Ctrl; a soft red behind the word, the tone of the line of an error while running.

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
- In a menu of the header, the row chosen with the keys takes the ring; the row under the pointer never does.
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
| `--tracking-label` | `0.05em` | The spacing of the letters of a title in capitals. |

- **Figures of one width** (`font-variant-numeric: tabular-nums`) where a number changes in place: the status bar, whose steps count up while a program runs, and the size of the window in the message that asks for a larger one. The code already has them.

## Spacing

One scale of eight steps for every distance, so that a new screen picks a step instead of adding a value of its own. The section *Spacing and radii* of the mock-up draws each step at its real length.

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
| `--space-8` | `8px` | Two neighbors: two buttons, two messages of the console, a title and its sentence; a field and its text; a tip and what it names. |
| `--space-12` | `12px` | The sides of a band and of its rows: the header, the status bar, a row of a menu, the code after its margin; two paragraphs. |
| `--space-16` | `16px` | The sides of a panel and of what opens over the screen: the console, the goal, the legend, the level chosen on the home screen, the side of the manual. |
| `--space-24` | `24px` | The sides of a panel in the middle of the screen: the settings, the shortcuts, a confirmation, the success panel; two groups in a row. |
| `--space-40` | `40px` | The margins of a page that is read, the manual, and what separates two of its sections. |

- Every padding, margin and gap takes a step, and so does the distance of a floating element from the edge it hangs on: the three controls from the corner of the editor, a cross from its corner, a tip from its button.
- A panel that starts with a title has one step less above it than on its sides (12 above 16, 16 above 24): the line of the title already brings room over its letters.
- A small button and a tab have 4 pixels above and under their text and 12 on their sides; a button, 6 and 16; a row of a menu, 6 and 12. The two values of a choice, 4 pixels inside a track of 2, are as tall as a button.
- The sizes aren't on the scale: the heights of the bands, the widths of the columns and of the panels, and the places that follow them (the bubble of the goal under its button) belong to the layout of each block.
- The scale replaces the 34 values of the mock-up, each written by hand (decided on 2026-11-16, compared on every window of the mock-up): 170 of the 295 distances moved, most by 1 or 2 pixels, the page of the manual by 10. Left out: 10, 14, 18 and 22 pixels, the most used after 8 and 12, too close to their neighbors for a new screen to tell which to pick.

### Exceptions

The alignments tuned by eye keep their value, written in their block with its reason:

- A header that draws the bar of the progress, and the name of the manual, keep 3 pixels under their content, the height of the bar, above which the content is centered: 49 pixels in all. A header without the bar, as the one of the sandbox, is 46 pixels high (decided on 2026-11-17: with the 3 pixels left empty, the fill of a menu stood 8 pixels under the top of the header and 11 above its bottom).
- A link of the goal has 4.5 pixels above its text and 5.5 under it: the text sits half a pixel high, tuned on the owner's screen.
- The icon of a note of the console sits 3 pixels lower, on the lowercase letters of its line.
- The robot of a goal moves 2 pixels to the left in Night Desk, where its dark outline fades into the bubble.
- *On this page* starts 4 pixels lower than the page of the manual, on the capitals of its title.
- A stone and the robot of the home screen are placed by their center, and the caret of the editor by its middle: half their size, not a step.
- What the robot says in the manual keeps distances in `em`, which follow the size of its text.

## Radii

Three radii, each with a role. The section *Spacing and radii* of the mock-up shows each on what it rounds.

| Token | Value | Role |
|---|---|---|
| `--radius` | `3px` | Everything of the interface that has corners: a button, a control, a tab, a field, a tip, a label, a row under the pointer. |
| `--radius-mark` | `2px` | A mark smaller than a letter: a square of the speed, the square of a map under its level, a word found by the search. |
| `--radius-bubble` | `0.7em` | What the robot says: the corners of its bubble follow the size of its text, 12.6 pixels around the title of a goal, 18.9 around a sentence of the manual. |

- The zones have square corners: the blocks, the bands, and the menus, the bubbles and the panels that open over the screen.
- So does a button that lies against the edges of its zone: a tab of the map, **Legend**, **Let's go**, the way back from the manual.
- A circle is written `50%`: a stone of the home screen, the number of a level, a breakpoint, a dot.
- A drawing keeps the corners of its shape: the visor of the robot on the level to play, the stroke of paint of the success panel, rounded as the brush by half its height.
- `--radius` replaces `--radius-small` and `--control-radius`, two names for the same 3 pixels, left by the comparison of the styles (decided on 2026-11-16). Three values moved, hardly seen: the squares of the speed, from 1 pixel to 2; the bubble of a goal, from 12 pixels to 12.6; the bubble of the manual, from 21.6 to 18.9.

## Motion

Little moves in the interface, so that what moves is seen: the robot on the map first (see [Animations](../specs.md#animations)), then a few places where the interface takes after it. Four durations and four curves time them. The section *Motion* of the mock-up plays each of them.

### Names

- `--duration-<role>` and `--ease-<role>`: the kind of value first, then what moves so.
- What moves takes its two values from the tokens: `transition: transform var(--duration-appear) var(--ease-pop)`.

### Durations

| Token | Value | Role |
|---|---|---|
| `--duration-fade` | `100ms` | What gives way under the pointer: the number of the level to play under the face of the robot, the shadow of a level done. A menu of the header that opens. |
| `--duration-appear` | `200ms` | What appears, or goes back to rest: the face of the robot on the level to play, **Unlock** turning amber, a bubble of the manual, the success panel; the paint leaving a main button. |
| `--duration-stroke` | `850ms` | The robot crossing a main button under the pointer, its paint behind it: **Let's go**, **Unlock**, the way back from the manual. |
| `--duration-flash` | `1600ms` | What lights up to be noticed, then fades: the place reached in the manual; the status bar when the learner types in an editor that is locked. |

### Curves

| Token | Value | Role |
|---|---|---|
| `--ease-appear` | `ease-out` | What arrives or fades: fast at first, then settling. |
| `--ease-pop` | `cubic-bezier(0.3, 1.6, 0.5, 1)` | What pops: it goes past its size and comes back, as the robot goes past its quarter turn. |
| `--ease-stroke` | `cubic-bezier(0.35, 0.05, 0.4, 1)` | The brush: it sets off gently, crosses fast and settles. |
| `--ease-move` | `ease-in-out` | What goes from a place to another, starting and stopping gently, as the robot moves forward: the robot of the home screen, the head of the success panel. |

- What answers the learner is there at once. A fill under the pointer: a row, a button, a tab. What they open or close: the command menu, the bubble of the goal, a panel over its veil, the drawer of the manual. As in a code editor, nothing waits between a key and its answer, and the command menu and the manual are opened all the time.
- So what moves is what the learner didn't ask for, or a manner of the robot: the success panel, which comes by itself once the robot has hopped, a place that lights up, the paint across a main button.
- One exception, for now: a menu of the header grows from the corner under its name, from 85% of its size and from nothing to opaque, in `--duration-fade` with `--ease-appear`, and goes back the same way when it closes, in six tenths of that time. The rows answer while it opens; a menu that takes the place of its neighbor, with the arrows or the pointer, is there at once; nothing moves for a learner who asked for less motion (decided on 2026-11-17, in the live window of the menus of the mock-up, the owner finding it friendlier; left with it: a menu that unrolls from the bar, that slides down, or that pops as the robot, whose bounce only shows from 200 milliseconds).
- Rejected (decided on 2026-11-17, compared in a live window of the mock-up): a veil that fades in, its panel rising as the success panel and the drawer of the manual sliding in from the right, in 200 milliseconds; a menu and a bubble fading in as well, in 100.
- The tokens replace a dozen values written one by one (decided on 2026-11-16): 0.2, 0.22 and 0.25 seconds became 200 milliseconds, 0.1 and 0.15 became 100, hardly seen.

### Scenes

A scene tells a small story in several moves. It keeps its durations and its delays, written in its block, and takes its curves from the tokens:

- **The robot of the home screen**: it looks around every 7 seconds, peeks left and right from the level under the pointer every 2.2 seconds, slides to the level chosen in 450 milliseconds, and is tossed by a level done in 850.
- **The success panel**, in about two seconds: the band painted in one second, its title, the head that drops in 550 milliseconds, on a curve of its own, a fall, then its face drawn.
- **An example of the manual**: a step every 700 milliseconds; **Run** comes back in 800.
- **Clear all progress**: the two seconds of its wait, at a steady pace, since its bar measures a time.

### Less motion

For a learner who asked their system for less motion (`prefers-reduced-motion`), nothing moves in the interface: a main button only lights up under the pointer, nothing pops, the robot of the home screen stays still, the success panel is there at once. A change of tone stays, since nothing moves: the flash, the bar of **Clear all progress**. The map has rules of its own (see [Animations](../specs.md#animations)).

## Messages

The texts of the interface are in English, in the translation files (see [Interface language](../specs.md#interface-language)). Their tone is a principle of [specs.md](../specs.md#design-principles): short, friendly, in the second person, never blaming, an error giving the rule and never the fix. These rules say how a text is written, so that a new one reads as the others.

### Voice

- **You** is the learner: *your code*, *your program*, *your progress*. The robot is *the robot*; it speaks for itself in a bubble only: the title of a goal, a sentence of the manual.
- When Stepwise is the one that can't, it says so of itself: *"Stepwise couldn’t load"*, *"Stepwise needs a larger window"*. When a program goes wrong, the sentence is about the program, the robot or the name, never about the learner: *"The robot bumped into a wall."*, *"The name `foward` doesn’t exist."*
- Contractions, as one speaks: *can’t*, *isn’t*, *doesn’t*.
- No *please*, no *sorry*, no *oops*, and no *invalid* nor *illegal*, which judge without explaining.

### An error

- Two sentences: in extra-bold, what happened in this program, *"`paint_side` takes 1 value, not 2."*; under it, the rule, true of every program, *"A call gives one value for each parameter of the function."*
- The rule never becomes an order nor a guess: no *"Remove a value from the call."*, no *"Did you mean `forward`?"* (decided on 2026-11-10, see the principle; the mock-up, drawn before, was brought in line on 2026-11-17).
- An error while the program runs has the same two sentences: *"The robot bumped into a wall."*, *"`forward()` needs a free cell in front of the robot."*

### Capitals

- A capital at the first word and at a name: Stepwise, Day Desk, a key (Ctrl, Esc). A title, a button, a menu and a tab are written as a sentence: **Restore starting code**, **Keyboard shortcuts**, never *Restore Starting Code*.
- No capital after a colon, nor after the dot that separates two parts of a state: *"The goal isn’t met: 7 cells of the square aren’t red."*, *"Ended · level done"*.
- The name of a command keeps its capital in a sentence, as on its button, without quotes: *"Paused at line 5 · Reset to edit"*.
- A title in capitals (*NEW*, the chapter of a level, a group of commands) is written with one capital in the translation file: the style sets its capitals (`text-transform: uppercase`).
- Code never takes a capital, even at the start of a sentence: *"`forward()` needs a free cell in front of the robot."*

### Punctuation

- A sentence ends with a period, even alone: a message, the sentence under a title, a tip that explains (*"Puts the map back. Your code stays."*).
- What names has none: a title, a button, a menu, a tab, a label, a state of the status bar, a tip that only names its button (*Close*, *Show the goal*).
- An exclamation mark for a level done, and nowhere else: *"Level 18 done!"*
- An ellipsis is one character, `…`, and has one use: at the end of a command that asks a question before it acts, **Restore starting code…** in its menu. The button that answers the question has none, nor **Clear all progress**, which asks nothing. Never for a wait, nor for a sentence left open.
- ` · ` separates the parts of a state or of a label (*"Running · Reset to edit"*, *"Loop until · while, not, break"*); ` › ` the steps of a path (**Level › Restore starting code…**, *Manual › 2. Commands › Move*).
- What the learner typed that isn't code, a search or the code of a level, is between typographic quotes: *"No command found with “pizza”."*
- The apostrophe of a text is the typographic one, `’`, as its quotes: *Let’s go*, *"The goal isn’t met."* The straight one of the keyboard belongs to the code. The translation file holds the typographic one; the other documents, typed at the keyboard, may quote a text with the straight one (decided on 2026-11-17).

### Code in a message

- Code is written as in the editor: a function with its parentheses, `forward()`; a keyword alone, `while`; a name of the learner as they typed it, `sids`. Never translated.
- It is in the font of the code, at 0.92 em, where the text around it is in Manrope: a goal, the manual, the command menu. In the console and under the pointer in the editor, where every text is in that font already, nothing marks it.
- A sign alone is between straight quotes, so that it is seen: *"Expected ':' at the end of the `while` line."*
- A key is named as on the keyboard, the keys held together joined by `+`: **Ctrl+Space**, **Shift+Tab**.
