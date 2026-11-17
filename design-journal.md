# Design journal

One entry per application: the design choices made with the owner, the ones rejected, and why.

**This journal is a source of ideas, not a set of rules.** Each application has its own users, subject and constraints: its design starts from its own wireframes and explores new directions (see the mock-up phase of [process.md](process.md)). An entry of this journal may inspire one of the styles compared, never all of them, and nothing here is a default.

## rust-exile-market (2026-10)

A small desktop window, a companion to Path of Exile 2, that prices a copied item ([mock-up](https://github.com/aunimhsn/rust-exile-market/blob/main/docs/mockups/narrow-styles.html), [specs](https://github.com/aunimhsn/rust-exile-market/blob/main/specs.md)).

### Context

- Used next to a dark, busy game, often on a second screen; the player glances at it between two items.
- Many kinds of data in a narrow window (420 px): item, price in three currencies, stats, filters, offers.
- The game already has strong color codes (item rarities), which the interface had to respect.

### How it went

1. A first coded mock-up, all at once (layout, content and style together): correct, but generic and never exactly what the owner wanted.
2. Editable Excalidraw wireframes, iterated with the owner: the owner drew, Claude Code rearranged and completed. The layout became personal.
3. Three styles on one HTML page, switched with tabs: A · Forge (engraved capitals, gold, close to the game), B · Slate (geometric, modern), C · Compact (condensed, dense). The owner picked Slate.
4. About a hundred small decisions on Slate, each compared on the page with a temporary tab, decided by the owner on their own screen, then the tab removed.

### Choices kept

- **Bands, not cards**: full-width bands in two near-black grays, without borders or rounded frames ("rounded cards look old").
- **White as the main action color**; the colors only carry a meaning: item rarities, the softcore (blue) or hardcore (red) league, warnings (dark yellow bands), better or worse (green, red).
- **Flat square action blocks** glued to the edges (league, settings, search, refresh); **small information elements rounded by 3 px** (tags, inputs, checkboxes); **secondary actions as pills** with a verb ("Check on trade", "Show 6 stats", "Copy whisper").
- **Minimalism**: every redundant text, counter or icon removed; e.g. "Show the next 10" became a bare double chevron, the stats chevron became a pill.
- **Manrope** for the text, **JetBrains Mono** for the numbers that line up; a point as decimal separator in every language, no thousands separator.
- **Subtle hover motion**: an icon grows, the refresh icon turns a quarter, a chevron slides 2 px.
- A **vivid orange** (`#ff8c1a`) for the best tier, the only accent that "pops".

### Choices rejected

- A blue accent: it clashed with the blue of the magic items.
- Bronze tints and a glow on the item name: "looks old", "hurts the eyes".
- Poppins: its uneven character widths looked irregular in a narrow window.
- Badges for the tiers: too heavy; plain colored text was enough.
- Icons next to text when they never looked aligned: replaced by pills or removed.

### Lessons

- Pixel alignments (icon and text) are tuned **by eye on the owner's real screen**, with a tab of offsets (0, 0.5, 1… px); headless screenshots at another display scale only give the direction.
- Icons are aligned on the lowercase letters, not on the box of the text.
- Text symbols (⌕, ↻, ✓) render small and off-center: draw the icons as SVG lines.
- A class name shared by two components (`top`, `online`) silently broke the layout twice: prefix the state classes.

## Stepwise (2026-11)

A website that teaches programming step by step: the learner writes a program in a small language, and a robot runs it on a map, one step at a time ([sheet of the world elements](docs/mockups/world-elements.html), [mock-up](docs/mockups/interface.html), [design system](docs/design-system.md), [specs](specs.md)).

### Context

- Learners who start programming, often in a classroom with a trainer, on a laptop or in front of a projector.
- Two things to read at once, the code and the map: the eye goes from the line being run to the robot and back.
- A world to draw before any interface: the floor, the walls, the paints, the objects, the goals and the robot, as SVG files that the application reuses as they are.
- A full window only, of 1280 × 720 pixels at least; no phone.

### How it went

1. The world first: every element of the map drawn one by one on a sheet, ten styles compared with tabs, then all together on a small map. Daylight was kept, a light gray floor and slate walls, and the head of the robot became the logo.
2. Excalidraw wireframes: four layouts of the level screen, then the other screens, the states of a run and the messages.
3. The mock-up, in 3 or 4 styles around that world; two were kept as the two themes, Night Desk and Day Desk. Then every screen, state and size, one decision at a time, each with a control of its own on the page: tabs for a few distinct variants, lists for values that combine (a font per role), sliders for values tuned by eye.
4. The motion and the sounds on the same page: the robot playing each action in a loop on a small map, the sounds compared by ear.
5. The design system last, drawn from the mock-up: the values gathered one by one (23 text sizes, 34 spacings, a dozen durations) merged into short scales, each merge compared on every window.

### Choices kept

- **Zones without lines**: the header, the editor, the map and the panels meet without any border, each in its own tone, with small radii and buttons that lie flat against the edge of their zone.
- **Color only for what carries a meaning**: the amber for what to do (the paint of the logo, **Run**, **Let's go**), the cyan of the eyes of the robot for what is new, the teal for what has passed, the red for an error. The paints of the map keep their own shades.
- **Two themes from one style**: a dark one, close to the editors of developers, and its light version; the map keeps its look in both.
- **Three fonts, one role each**: Fredoka for the personality, kept rare; Manrope for the interface; Source Code Pro in semi-bold for the code, the console and the variables.
- **The robot as the character of the interface**: its head is the logo, it speaks in the bubble of a goal, crosses a main button with its paint under the pointer, paints the top of the success panel, and frowns on a message that replaces the screen.
- **Three floating controls** in the corner of the editor (**Run**, **Step**, **Reset**), pale while the learner types; a status bar that takes the color of the state of the program, as in a code editor.
- **What the learner opens is there at once**; what moves is what they didn't ask for (a flash, the success panel) or a manner of the robot.
- **An error states the fact and the rule, never the fix**, and keeps the red wave of the code editors: an error is what must catch the eye first, even in a calm interface.
- **Tokens named by their value where the value is the meaning** (`--space-12`), by their role elsewhere (`--accent`, `--duration-appear`).

### Choices rejected

- The nine other styles of the world: Daylight was the clearest for learning and on a projector.
- A green of its own for the progress, beside the teal: two greens that didn't go together.
- A focus ring outside the element, or in the cyan or the amber: the edges of the zones cut it, and both colors already carried a meaning.
- A bold, an extra-bold and a medium beside the three weights: hardly told from the semi-bold.
- Panels and menus that fade or slide in when the learner opens them: a wait at each click, for something they asked for.
- Squares, dots, dashes, a line or a highlight under an error: each too close to another underline of the editor, or mute without its red.
- Suggestions in the errors (*"Did you mean forward?"*): the checks know the fact, not the intention, and applying the rule is how the game teaches.
- The level codes shown to the learner: they became the teacher's alone.

### Lessons

- Draw the world before the interface: the style of the map gave the palette, the logo and the character of everything after it.
- One decision at a time, one control per message, the recommendation in the first sentence: two groups of tabs in one message were read as four options of one choice.
- Say a change in plain words, what it is and where it shows: a bare *16 px* was read as a text size.
- Draw a proposal on the mock-up instead of describing it: the owner decides on what they see.
- Controls that the owner drives (lists, sliders, their values kept in the address) settle in minutes what variants drawn one by one take hours to reach.
- For a normalization that can hardly be seen (a weight, an apostrophe), the owner wants the call, not a comparison.
- The mock-up gathers its values one by one, and the design system merges them afterwards. Comparing the captures of every window before and after tells that a renaming moved nothing, and which windows a merge moved.
- A mock-up drawn before a principle keeps its old texts: its errors still suggested a fix a week after *never the fix* was decided. Read the mock-up again after each new principle.
- Motion, sounds and keys need a page that plays them: a scene in a loop for an animation, the sounds side by side to compare by ear, a tester for the keyboard shortcuts.
