# Roadmap archive

The detail of the steps done, moved here from [roadmap.md](../roadmap.md) once their pull request is merged.

## 1. Sheet of the world elements

### 1a. Styles compared (#4)

Ten styles tried; Daylight chosen (a light gray floor, slate walls, the clearest for learning and on a projector), the paint drawn as a stroke of 28 through the centers of the cells along the path of the robot, the paint under the robot left hidden.

### 1b. Daylight refined (#5)

The goal marks (a ghost of the stroke, slots, a red flag when not met), the floor and the slate walls with a rim and an edge, the paints scarlet, bright amber and cobalt, the teal hexagon in the bay of the robot, its pincer and its eyes at the end of a run, the logo and the name; the shades in `specs.md`.

## 2. Wireframes

### 2a. Level screen (#6)

Four layouts compared, layout B (code left, map right) refined: a menu bar, the goal in a bubble, three floating controls, a status bar, the maps in the header, the large screen.

### 2b. Other screens (#7)

The home screen (a path of stones in rows, the chapters as bands, the level chosen on the right with **Play**), the manual (sections, search, content, *On this page*, a drawer from Ctrl+click), the sandbox as the level screen without goal, and what opens over a screen: the success panel, the legend, the command menu in three columns, the settings, the confirmations.

### 2c. States of a run (#8)

In `docs/wireframes/states.excalidraw`, from the level screen: running (Pause first, Step greyed, the editor locked and the status bar saying so when the learner types), paused on a breakpoint (the tab Variables opened), the errors before running (underlined, listed in the console), an error while running (its own mark ✕ in the margin, the code editable at once), a goal not met (a flag on each cell missed).

### 2d. Messages (#9)

In `docs/wireframes/states.excalidraw`: the storage refused (a banner of one line under the header), the window too small and the phone, the browser too old, and the files that can't load when offline, each message replacing the screen under the logo.

## 3. Mock-up

### 3a. Style of the interface (#11)

The level screen (paused, an error while running, a menu, the goal) in 3 or 4 styles around the world of step 1; Day Desk and Night Desk kept as the two themes; the logo reworked so that the name lines up with the menus.

### 3b. States and sizes of the window (#12)

Every state of a run (ready, running, typing refused, paused on a breakpoint, errors before running, goal not met, a map and the level done), the three controls with their hover, the variables panel, the sandbox, the large screen and the largest map.

### 3c. Keyboard (#13)

The four menus, the keyboard shortcuts of the controls decided (checked against those of the browsers, such as F5 and F11, on an AZERTY keyboard), the shortcuts of comfort of the editor (see [Code editor](../specs.md#code-editor)), the command menu.

### 3d. Panels (#14)

The success panel, with the robot that paints its top and turns into the logo; the legend of the map; the two confirmations. The level codes became the teacher's alone: the interface never shows them.

### 3e. Home screen (#15)

The path of the levels with its chapters, the stones and the squares of their maps, the robot on the level chosen; the panel of a level to play, done and locked with its code; the large screen, and more levels than fit.

### 3f. Manual (#16)

A section with its commands and examples, the search and its results, **On this page**, the drawer over the level screen, the large screen.

### 3g. Settings and messages (#17)

The settings with the theme, the storage refused, the window too small and the phone, the browser too old, offline.

## 4. Workspace and probe

### 4a. Cargo workspace (#18)

`crates/core` (a plain library with the lints that forbid panics), `crates/wasm` (its bridge, built for `wasm32-unknown-unknown`), `src/main.rs` and the release workflow removed, the Rust CI on the whole workspace (with the WebAssembly target and the minimum version), `CLAUDE.md` and the README updated (commands, `--workspace`). Reviewed twice, by `code-reviewer` on Opus 5.5 and on Fable 5.2, to compare the two models.

### 4b. SvelteKit application (#19)

`web/` with TypeScript strict, `adapter-static`, Fluent and `locales/en.ftl`, ESLint, Prettier, Vitest and `svelte-check`; `web/scripts/build-wasm.ts` (`cargo`, then `wasm-bindgen` at the exact version of the crate, checked before building); the front-end checks in the CI, skipped for documentation only behind the single required job `CI`; a page showing a Fluent message and the version of the core computed in Rust.

### 4c. Probe (#21)

A fake program of a few steps in Rust, advanced by `step()` at each animation frame from Svelte, moving the robot on a small map at each of the five speeds; the size of the WebAssembly module measured, with `opt-level` 3, `"s"` and `"z"` compared and the choice written in `docs/technical-choices.md`.

### 4d. Deployment (#22)

The website deployed to GitHub Pages by a workflow at `stepwise.sylent.tools` (the path never hard-coded; the owner adds the DNS records, see [GitHub Pages usage](github-pages-usage.md#address)); `main` protected by a ruleset requiring the check `CI` (the last job of `.github/workflows/ci.yml`).

## 5. Lexer (#23)

The tokens of the language with their positions, the indentation turned into block starts and ends (four spaces, no tab), the texts and their escapes, the comments; every error as a code with its values and its position. Tests of every rule of [Lines and indentation](../specs.md#lines-and-indentation) and [Names](../specs.md#names).

## 6. Parser

### 6a. Expressions and simple statements (#25)

The syntax tree and `parse(source)`; the expressions with their priorities and the calls; `let`, the assignment, `break`, `return`, an expression alone on its line; the errors of the expressions (`=` for `==`, chained comparisons, a parenthesis not closed, a value missing, a comma at the end) and the words of other languages (`elif`, `def`, `for`…), wherever they are; a maximum depth of 200 for the tree, long chains of operators included, an error rather than an overflow of the stack of the browser, in the parser or later in the checker and the interpreter. A line that opens a block is still an error.

### 6b. Blocks (#26)

`if`, `else if`, `else`, `while`, `repeat`; the errors of the blocks (a missing `:`, something after the `:`, an empty block, a block that holds only comments, which are the comments indented further than the line of the `:`, the lexer giving the lines of the comments it drops, an indentation that follows no `:`, an `else` without its `if`, an `else` after the `else`); each block counts for one level of the maximum depth, and the blocks alone nest up to 50 deep.

### 6c. Functions (#27)

`function` with its parameters and the errors of its line (a missing name, missing parentheses, a parameter that isn't a name alone, a comma after the last parameter); the stack the parser needs at the maximum depth, measured again in WebAssembly with 50 blocks around the deepest expression, the worst case (see [Technical choices](technical-choices.md), Parser).

## 7. Checker

### 7a. Structure and form of the names (#29)

`check(&Program)` and its errors as codes; `break` and `return` in place, functions at the top level, `snake_case` names, the names reserved by the built-in functions and the colors (their lists, shared with the interpreter), two parameters of the same name.

### 7b. Variables (#30)

The scopes of the blocks and of the functions; a variable used before its `let`, after the end of its block, or from a function that doesn't see it (three errors of their own, for a variable read or changed); a name declared twice; a variable changed without `let`; unknown names; the colors as values. The checker then walks the expressions, and checks the form of a new name apart from declaring it, since `let x = x + 1` reads its value in between; a reserved name that is given a value keeps its one error. The messages state the error and recall the rule, without suggesting a fix (decided on 2026-11-11, see [Design principles](../specs.md#design-principles)). Until 7c, a function of the program named without parentheses is an unknown name, and a built-in one no error.

### 7c. Functions (#31)

A function called above its definition, two functions of the same name, a variable or a parameter named as a function, the number of values of a call (built-in functions included, `print` taking any number), a function named without parentheses, a variable called like a function, a call of a name that is no function, an expression alone on its line that isn't a call. A first pass collects the functions of the program: a name is refused as soon as a function has it, wherever it is defined. Eight gaps of the specifications decided on 2026-11-11, written in [Names](../specs.md#names), [Statements](../specs.md#statements) and [Functions](../specs.md#functions).

## 8. Map and levels

### 8a. Map (#32)

The world in Rust alone, without `serde`: its cells (floor or wall, at most 16 × 12), paints, painted passages (a passage has no color: each cell draws its half in its own), items, and the robot with its direction, the item it carries, and its brush or its eraser; every action of a built-in function and every sensor as a method of the world, returning its error (the bump, the item missing or already carried, the robot's state checked before the cell), so that step 9 only calls them. Decided on 2026-11-12: [Map](../specs.md#map), [Built-in functions](../specs.md#built-in-functions).

### 8b. Levels (#33)

The TOML format with its version (decided on 2026-11-12 rather than JSON, see [Technical choices](technical-choices.md), Levels), one file per level in `web/levels/` named after its stable name, its validation (a map of a level has goals, not all met at the start, and enough items), the goals checked on a world with the cell of each goal not met, the file of the sandbox, and a test that reads every level file of the repository and checks its starting code.

## 9. Interpreter

### 9a. Machine and statements (#34)

The values, the expressions and their errors (types, division by zero, overflow), the variables, `if`, `while`, `repeat`, `break`, the steps and the current line; `print` alone among the built-in functions, so that the tests see what a program does. Until 9b and 9c, calling a function of the program or another built-in function stops the program with the error kept for what the checks rule out.

### 9b. Functions (#35)

The calls, the stack of frames, the parameters, `return`, the value missing, the limit of 200 calls; the calls in progress and their variables, readable for the variables panel.

### 9c. Robot (#36)

The built-in functions acting on the map and the sensors, their errors, a value that is no color given to a function that takes one (decided on 2026-11-14), what each step reports (the action of the robot by its name, the printed line; an action that fails is told by its error alone), and whole programs run on the maps of three trial levels kept with the tests, their goals checked at the end. The probe of step 4c stayed: the page still ran it through the bridge.

## 10. WebAssembly bridge

### 10a. Checks (#37)

How the data crosses the bridge (see [Technical choices](technical-choices.md), Bridge), the places of the source as the editor counts them (a line, and offsets in UTF-16 code units), `check(source)` and every error of syntax, of names and of structure with its TypeScript type; a function of the core that checks a source and gives either its errors or a checked program, the only one the machine will run (decided on 2026-11-14); tests from TypeScript on the place of an error after accents and an emoji.

### 10b. Levels and map (#38)

A level file or the sandbox read through the bridge, each kept in the module as a handle (the exported classes `Level` and `Sandbox`): the starting code and, for each map, the world as plain data (the cells row by row, the paint of a cell with its painted passages on its four sides, the items, the robot without its brush nor its eraser) and the goals that have a cell, to mark; a file the core refuses throws an error with the sentence of the core (decided on 2026-11-14).

### 10c. Running (#39)

Start, the machine asking for the checked program of 10a, step, the state, the events, the errors while running, the goals checked at the end by a type of the core that holds a map and its machine, the calls in progress and their variables. A step gives back a word (what it showed: an action of the robot, a line printed, nothing); the next line, the line printed, the world, the end and the variables are read by other calls, when the interface needs them (decided on 2026-11-14). The two tests through the real module (the maximum depth, the lines highlighted with accents and an emoji).

### 10d. Probe and measures (#41)

The probe of step 4c run by the real machine: a real program on the map of the sandbox, at the five speeds, the line of its next step marked; its fake program removed from the core and the bridge. The size and the speed of the module measured again, `opt-level` 3 kept and `wasm-opt` left out (see [Technical choices](technical-choices.md), WebAssembly size).

## 11. Animations and sounds

### 11a. Animations (#42)

The robot playing each action on a small map: moving, turning, painting and erasing, `pick_up()` and `drop()` with the pincer, the bump into a wall, an action that fails, the end of a run that succeeds or fails; the normal speed, the duration of each action, and the motion for a learner who asked for less; the decisions written in `specs.md`.

### 11b. Sounds (#45)

The sounds of the end of a run, of a bump and of the moves, compared by ear on the same page (synthesized in the browser, CC0 files by Kenney, bolder ones made by a Python script); every sound synthesized with the Web Audio API in the application; the terms of the sources in `docs/sound-sources.md`; the decisions written in `specs.md`; a part on sounds in the `html-mockups` skill. The tuning of the animations at every speed is left to step 14, in the application.

## 12. Design system

### 12a. Colors (#46)

The roles and the names of the color tokens of the two themes, in `docs/design-system.md`; the tokens that the comparison of the styles left with the same neutral value everywhere removed, the colors written in the blocks named; the keyboard focus, a ring in the color of the text of the element, inside its edge, compared in variants on the mock-up; the teal alone for what has passed, without the green. The flag of a goal not met keeps its own color, apart from the red paint. The contrast of the texts is left to the [backlog](backlog.md).

### 12b. Typography and fonts (#47)

A scale of eight text sizes (23 in the mock-up), three weights and five line heights, per role, each compared on every window of the mock-up; figures of one width in the status bar; one variable file per font committed in `web/static/fonts/` beside its license, the complete file of Adobe for Source Code Pro, whose reserved name rules out a subset, after comparing with the npm packages of Fontsource (see [Font sources](font-sources.md)); two scripts in the `html-mockups` skill that compare the captures of a mock-up.

### 12c. Spacing and radii (#48)

A scale of eight spacing steps (34 values in the mock-up), named by their length, the alignments tuned by eye staying named exceptions; three radii, one name replacing two for the same 3 pixels; both compared on every window of the mock-up, which shows them in a section of its own.

### 12d. Motion and tone (#49)

Four durations and four curves of the interface named as tokens, in place of a dozen values written one by one, the scenes of a block keeping their own timing; what the learner opens is there at once, the fades and the slides compared in a live window of the mock-up being rejected; the writing rules of the messages (the voice, the two sentences of an error, the capitals, the punctuation, the code in a message), six errors of the mock-up brought in line with the principle of the rule, never the fix; the typographic apostrophe in the texts; the entry in `design-journal.md`.

## 13. Application shell

### 13a. Tokens and pages (#50)

The tokens and the two themes in the application, the fonts, the base styles (the text, the keyboard focus, the scroll bars); the four pages and their addresses, with one draft level (`paint-a-square`, replaced at step 23) so that the level screen has a level to show; the header with the logo, the name, the links of the home screen and, in its middle, the title of the level or the sandbox; the probe moved to the page of the sandbox.

### 13b. Menus (#51)

The menu of the header, with the mouse and the keyboard; **Level** (**All levels**, **Sandbox**) and **Help** (**Manual**), the commands that exist; the row of the screen already shown, lit; a menu that grows as it opens and goes back as it closes; a header 3 pixels shorter without the bar of the progress; the class that the links and the names of the menus of a band share.

### 13c. Storage and settings (#52)

The browser storage with its version, the saved data that can't be read ignored; the gear of the header, the first icon made of several shapes (left by the review of 13a), and the panel of the settings over its veil, with **Theme** alone until **Sounds** (step 18) and **Clear all progress** (step 21) bring their rows; the theme saved, applied before the first paint and followed by the other tabs already open; the banner when the storage is refused, on every screen but the manual, hidden while the page stays open.

### 13d. Messages (#53)

The window too small on every screen, the manual too (its size followed live, the phone), the screen kept under it; the browser too old, the files that can't load and JavaScript turned off, written in the page itself, which watches the application start; the page of an address that doesn't exist, served by the host as `404.html`; *JS* and *404* hardly there behind their messages; the icon of the tab, the head of the logo drawn for 16 pixels. Left to step 17: a run paused while the window is too small.

## 14. Map view

### 14a. Static map (#54)

The level screen and the sandbox laid out as the mock-up (the code on the left, the map on top on the right, the panels under it, still empty); the map of the level (its first map, until the tabs of step 21) and of the sandbox drawn from the core: the floor, the walls with their rim and their edge, the lines every five cells, the shadows, the paint strokes, the goal marks, the items, the robot facing its direction with the item it carries; the cells sized to fill the block, 64 pixels at most; the probe moved into the column of the code, drawing on that map.

### 14b. Bench and first moves (#55)

The probe turned into the bench of the animations, on the level screen and in the sandbox: short programs made for the map of the screen, played with **Run**, **Pause**, **Step**, **Reset** and the five speeds, the line of the next step marked once the action has ended; `forward()`, the turns, the brush and the eraser animated, tuned with the owner at every speed: 300 ms up to 2 steps per second, 80 % of a step faster; **Step** plays its action as at the slowest speed; the tool the robot has down given by the bridge, for the animations.

### 14c. Carrying and the errors of the robot (#56)

`pick_up()` and `drop()` animated: the robot steps back a quarter of a cell, its pincer takes the item of its cell over itself into its bay, or sets it down there, then it rolls back onto its cell. The bump against the border of its cell, then back onto it shaking its body; the `pick_up()` and `drop()` that fail tried, showing what goes wrong (an empty pincer, a full bay that swells, an item that can't go down), then shaken. These errors stop the program, so they keep their whole time at every animated speed; the playback tells how the program stopped once its last action has ended, and the bench has a program for each of them.

### 14d. End of a run and less motion (#57)

Once the last action has ended, the robot shows how the run ended, in 900 ms at every animated speed and at once at **Instant**: every goal met, its eyes light up and it hops; a goal not met, its eyes dim, it shakes its head, then a flag is planted on each cell of a goal not met, in a wave when they are many; nothing in the sandbox, which has no goal. A program without a step only ends once **Run** or **Step** has started it. Less motion for every action, for a learner who asked their system for it, read as each step starts: a turn without its overshoot, `pick_up()` and `drop()` without the pincer nor the step back, the bump without its shake, a `pick_up()` or a `drop()` that fails and the end of a run shown at once. Each theme sets `color-scheme`, so that the native controls follow it. The bench of the animations stays in the column of the code until the running of step 17 replaces it.

## 15. Quality audit

### 15a. Plan and notes (#58)

The audit of the whole code, made on 2026-11-19 once step 14 was merged: the code is sound, and what needs work sits where steps 16 to 22 will copy, nearly all of it in `web/`. The owner kept its seven themes, which became the sub-steps 15b to 15g, one pull request each; what the audit found is kept in `docs/quality-audit.md`: the brief of each refactoring, what steps 16, 17, 18, 20 and 23 settle first, what is sound and should be copied, and what the audit chose not to change.

### 15b. Core (#60)

The errors of the domain of the levels apart from those of their file, a public surface that is what the bridge uses, the names that say two things. `Stroke::new` and `Goals::new` return their own errors (`StrokeError`, `GoalsError`), which `LevelErrorKind` wraps beside what only a file can have wrong, the sentences of them all staying in `level/error.rs`; the constants of the format went down to the modules that read it. What only the tests called left the public surface (`tokenize`, `parse` and `checker::check` stay public until step 16 has chosen where the highlighting comes from). `Stroke::passages()`, `Map::paint_crossing()` and `erase_crossing()`, since a step is a line run; `Effect` for what a built-in function did, `Outcome` being the end of a run; `Context` for where a statement is in the checker. New tests: no word is in two of the four lists of words of the language, and the sentence of every error of a level file is pinned. No behavior changed.

### 15c. Errors (#61)

The codes and the places of the errors settled before steps 16 and 17 write their messages and their underlining, the code of an error being the name of its message. `TooDeep` held two rules: it became `ExpressionTooDeep` (an expression deeper than 200 levels) and `BlocksTooDeep` (blocks nested deeper than 50), and the bridge gives each its `limit`, as it does for the runtime errors; `NumberTooLarge` crosses with the largest number a program writes, as its digits, since a number of JavaScript doesn't hold it exactly. `WrongArgumentCount` became `WrongValueCount`: a call gives values, the word of `specs.md`. `ExpressionKind::Name` holds a `Name` with its own span, so that the errors of a name read are on the name: `let a = (sidse)` underlines `sidse`, not `(sidse)`. Nothing shows these errors yet, so nothing changed for the learner. Along the way, the owner added the sub-step **15g. Stricter TypeScript**, the styles becoming 15h.

### 15d. Level screen (#62)

The wiring of the level screen, written twice, the same, in the route of a level and in the one of the sandbox, is written once, before steps 16 to 21 add the editor, the running and the panels to it. `level-screen.svelte` takes which screen it is (`screen: 'level' | 'sandbox'`, rather than an icon: the menus need it too, and the header shows before the core has loaded), its title and what it plays on, and lays out its header, the code, the map and the panels itself; a route keeps the loading of its file and the title of its tab. A `Playground` (`level-screen/playground.ts`) is what a level screen plays on: a stable name, the world at rest, the goals if any, the starting code, the way to start a program; `levelPlayground` and `sandboxPlayground` adapt `Level` and `Sandbox`, which stay two types in the core and in the bridge, since a map of a level without goal must not exist. `fromCore` (`core-ready.svelte.ts`) holds the life of an object of the module: made once the core is ready, freed once another replaces it or the screen leaves. The map draws one object, a `Scene` (`map/scene.ts`), which a `Playback` is as it is and a playground is at rest, so the map shows before any program. `levels.ts` gives the name `sandbox`, written once, and the file of the sandbox, loaded as the one of a level. A second Vitest project runs the tests named `*.svelte.spec.ts` in Node, their files compiled as for a browser, for what lives in a component. Nothing changed for the learner: the website built before and after gave the same screenshots in Chromium, and each object of the module was made once and freed once.

### 15e. Messages (#63)

Nothing kept the names of the messages that the code writes and the ones of the Fluent files the same: `t` takes any text, and a wrong name only warned in the console. One test, `web/src/lib/messages.spec.ts`, reads the code and the page itself (`app.html`): each name written in `t('…')`, `tAround('…')`, `findMessage('…')` or `%stepwise.text.…%` has its message, each message is read or belongs to a family, and a name that the test can't read (a variable, a template, `t` given as a value or imported under another name) is refused rather than left unread. It replaces the checks that each module made its own way. The naming rule is written at the top of `locales/en/interface.ftl` and held by the test: `<zone>-<thing>[-<part>]`, never a single word; a family, the messages whose names hold a name of the data, has a prefix that no other message uses and one function that builds its names (`levelMessage`, `themeMessage`, `adviceMessage`, `programMessage`). The names out of the rule were renamed (`sandbox` to `screen-sandbox`, `page-title` to `tab-title`, `close` to `panel-close`…), the texts staying the same. One file per domain in `locales/en/` (`interface.ftl`, `levels.ftl`, `bench.ftl`), all read into one bundle; the file of the errors comes with their first message. The test was kept rather than a generated type `MessageId`, for the reason written in `docs/technical-choices.md`. Nothing changed for the learner: the website built before and after said the same on 11 screens and states in Chromium.

### 15f. Layout of the interface (#64)

The root of `web/src/lib` mixed four kinds: what everything imports, the state of a run, the page itself, and modules of a screen that has its folder. A folder per domain now: `core/` (`core.ts`, `core-ready.svelte.ts`, their tests and `run.spec.ts`), `run/` (`playback.svelte.ts`, `pace.ts`), `page/` (`page-fill.ts`, `page-parts.ts`, `startup.ts` and the tests of the page), `levels/` (`levels.ts`, moved now rather than at step 21, so that the rule is born without an exception) and `level-screen/` (`level-menus.ts`); the root keeps what no domain owns and every folder may import (`i18n.ts`, `icon.svelte`, `elements.ts`, `platform.ts`, the test of the names of the messages). The rule is written in `CLAUDE.md` (Development), with its reasons in `docs/technical-choices.md` (Layout of the interface code), and held by ESLint (`no-restricted-imports` in `web/eslint.config.js`) rather than only written: a relative path names a file of the same folder and anything else is written with `#lib/`, a folder holds no sub-folder, the root imports no folder, the base imports no screen (`core/` only `page/`, `map/` only `core/`, `page/` only `styles/`, `styles/` no folder), `core/core.ts` alone reads the generated module and `elements.ts` alone the drawings; the layout being checked on `import … from`, `import()` of a file of the project and a type written `import('…').T` are refused. The folders are read from the disk, so a new one is held without being listed. The test helpers written again in each file are shared: `core/test-support.ts` (`loadTestCore()`, `levelFile(name)`, `levelOf`, `sandboxOf`, `corridor`) and `storage/test-support.ts` (`memoryBackend()`). Small points: an address is written one way, what follows the root of the website (`resolve('sandbox')`), which ESLint holds too; `saving` is read-only outside its module; `loadCore` gives nothing; the pattern of what is saved (`<thing>.ts`, `saved-<thing>.ts`, `current-<thing>.svelte.ts`) is written with its condition in `docs/technical-choices.md` (Browser storage). Nothing changed for the learner: the website built before and after gave the same six pages in Chromium, at the root of a domain and under `/rust-ts-stepwise`.

### 15g. Stricter TypeScript (#66)

`web/tsconfig.json` had `strict` alone and ESLint the `recommended` rules of typescript-eslint: the code followed the stricter rules by discipline and by its reviews, and nothing held it there while steps 16 to 22 write most of the interface. The compiler and ESLint now hold the interface as Clippy pedantic and the forbidden indexing hold the core. The compiler: `noUncheckedIndexedAccess` (`list[0]` and `table[key]` may be `undefined`), `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` and `allowUnreachableCode: false`; `exactOptionalPropertyTypes` is left out (the owner's choice: its errors were optional properties of components given a value that may be `undefined`, the usual way to hand nothing in Svelte), and so is `noPropertyAccessFromIndexSignature`, which adds no safety. ESLint reads the types, for every file: `strictTypeChecked` and `stylisticTypeChecked` in place of `recommended`, and the rules that no set holds, `switch-exhaustiveness-check` (a `switch` without `default` names every value of its union, so a new event or a new code of an error of the core must be placed), `no-unsafe-type-assertion`, `require-array-sort-compare`, `eqeqeq`, `no-var` and `svelte/prefer-const` in a component; three rules are tuned, each with its reason in `web/eslint.config.js`, and a warning fails the command. An exception to a rule is one line with its reason (`// eslint-disable-next-line <rule> -- <reason>`), as an `#[expect(…, reason = "…")]` of the core: its form is held, one that excuses nothing is an error, and a rule is never turned off for a file. `npm run lint` builds the generated module and runs `svelte-kit sync` before ESLint, which reads their types. The rules moved little code: `IconName` to `icon-name.ts`, `matchMedia` that may be missing in `run/playback.svelte.ts`, `scripts/build-wasm.ts` checking what `cargo metadata` gives, the scripts of the page read and run in `page/test-support.ts`. Written in `docs/technical-choices.md` (Strictness of the interface code) and in `CLAUDE.md` (Development). Nothing changed for the learner.

### 15h. Styles (#68)

The last refactoring of the audit: what the styles and the tables left to discipline is held by a name or by the compiler. The stacking order is a list of named layers (`--layer-pop`, `--layer-screen-message`, `--layer-page-message` in `styles/layout.css`, spaced by ten, their rules in `docs/design-system.md`), in place of figures written in two files that named each other in a comment. A button made of an icon alone is one component, `shell/icon-button.svelte`, in place of the cross of a panel, the cross of the banner and the gear: it takes the zone it stands on, whose look (the icon, the square, the fill) is one table that the compiler holds, and the block that shows it places it. The tables keyed by a closed list are checked: the tokens of the colors of paint (`map/paint-colors.ts`), the times of the events (`EVENT_TIMES` names every event of the core), two `switch` without `default`. Smaller points: the height of what is clicked in a band as a token (`--band-item-height`), `styles/app.css` importing the style sheets, a test that compares the fonts of the page, of the styles and of the disk. `CLAUDE.md` says when a look is a component and when it is a class of `styles/`, and that a table keyed by a closed list `satisfies Record<…>`. One fix that the learner can see: a panel left open stood over the message of the page itself (*"Stepwise couldn't load"*), so the first click on **Try again** only closed the panel; `page/startup.svelte.ts` now remembers that the application asked for that message, and a panel follows it and closes. Nothing else changed on screen: 44 captures the same to the pixel. Along the audit, a pull request of notes (#65) wrote what the layout checks ask of the next steps. Left to step 16, with its first button outside a message: `styles/button.css`.

## 16. Code editor

### 16a. Classes of the code (#70)

Nothing changed on screen: the core now says what each stretch of a line of code is, so that the editor of 16b gives it its color. The audit had left two choices to this step, decided on 2026-11-20: the colors of the code come from the core, rather than from a second lexer written in TypeScript for CodeMirror, and the words of the language cross the bridge as types that it generates, rather than as texts compared by a test (see Colors of the code and Words of the language in `docs/technical-choices.md`). `lexer::classify_line` (`crates/core/src/lexer/classify.rs`) reads one line and never fails, since a line being typed is wrong most of the time: a keyword, `true` or `false`, a number, a text, a color, the name of a function, any other name, a symbol, a comment, characters that the language doesn't read; a text not closed yet stays a text up to the end of its line. It shares its cursor with the lexer, which reads each piece whole and still stops at the first one refused, so `tokenize` gives what it gave. The bridge gives the stretches as plain objects (`classifyLine`, `crates/wasm/src/stretch.rs`), their places in UTF-16 code units, found in one walk of the line. `Keyword`, `ForeignWord` and `Builtin` are TypeScript unions of the words as they are written (`crates/wasm/src/word.rs`), and an error carries its word by that type; their lists at runtime (`vocabulary()`) wait for their first reader, the command menu (step 20). The public surface of the core is closed: the tokens, the tree, `parse` and `checker::check` are `pub(crate)`, held there by two lints (`unreachable_pub`, `unnameable_types`). Decided along the way: a name followed by a `(` is a function and a name alone a name, since a line read alone doesn't know the functions of its program; a reserved word is what it is wherever it is written, and a word of another language (`elif`, `for`) is a name, which the checks underline; Ctrl+click and F1 go whole to step 22. Measured in Node.js 24 on the release module: 0.7 µs per line on the sample of `specs.md`, 40 µs for a screen of 60 lines; the module weighs 429 kB (167 kB gzipped), from 426 kB.

### 16b. Editor (#72)

The code column of a level holds a real editor: CodeMirror 6 in `web/src/lib/editor/`, its parts taken one by one (`setup.ts`) rather than its ready-made set, which brings what the specifications leave out (several cursors, find and replace, folding). Its look is plain CSS on the classes of CodeMirror, with the design tokens (`code-editor.svelte`): the margin and its numbers, the selection, the cursor, the thin line at the 80th column. The colors of the code are marks on the lines shown, each stretch as the core names it (`code-colors.ts`, `classifyLine` of step 16a), and the core answers every other question about the language too: whether a line opens a block, whether the cursor is in a text or a comment, which parentheses make a pair (`typing.ts`, `pairs.ts`, `matching.ts`). The rules of typing: the indentation is four spaces, never a tab; Tab and Backspace move by stops of four; a new line keeps the indentation of its line, with four spaces more after a `:`; Tab and Shift+Tab move the selected lines. Three commands of CodeMirror are written here (Enter, Tab and Shift+Tab on a selection): its own are made for languages whose calls span several lines, and move by a whole unit whatever the column. Decided by trying the editor with the owner (2026-11-21), then written in `specs.md`: `(` and `"` are typed with the sign that closes them, nothing closing by itself in a text or a comment; the pair of parentheses at the cursor is lit; Enter finishes the line when only closing signs follow the cursor, rather than spreading the pair over three lines; Escape, then Tab or Shift+Tab, leaves the editor with the keyboard. Each level has its own editor, which opens on the starting code: the code isn't saved before step 16d. The bench of the animations moved under the map, in the zone of the panels, until step 17. ESLint holds the imports of `editor/`: `core/` and the root of `src/lib` alone. Measured: the JavaScript of the level screen goes from 58 kB (21 kB gzipped) to 339 kB (111 kB gzipped), and the home screen keeps its 14 kB. Two reviews, the second on the fix commits alone: eleven recommendations, all applied. Left to the backlog: a long line scrolls the code sideways under the margin without a mark.

### 16c. Commands and the menu Edit (#73)

The level screen gets its menu **Edit** (Undo, Redo, Comment lines, Move line up, Move line down, each with its shortcut beside it; Ctrl+Shift+Z and Ctrl+/ heard without being shown) and the shape of a command of a screen, which the steps 17 to 22 copy (see Commands of a screen in `docs/technical-choices.md`). A command is written once (`ScreenCommand` in `web/src/lib/shell/commands.ts`): its name, its text, its shortcut, whether it can run now, what it runs; the rows of the menus and the one listener of the screen read it (`shell/screen-shortcuts.svelte`), which hears every shortcut wherever the keyboard is on the screen, and nothing under a panel or a message in place of the screen. CodeMirror keeps the keys of typing alone: a test compares its bindings with the shortcuts of the commands. A shortcut reads the character, not the place of its key, since AZERTY is the keyboard of reference: a letter compares Shift, a sign doesn't. The editor knows neither menus nor shortcuts: it names what the screen may ask it, a closed list (`editor/edits.ts`), and the level screen gives each edit its text and its keys (`level-screen/level-commands.ts`). A row of a menu has a kind: a link, the screen already shown, a command, a separator. Decided with the owner on 2026-11-21: Undo and Redo are greyed while the history has nothing for them, rather than lit until a program runs (the mock-up updated); the bar of the menus remembers what held the focus when the mouse brought it there, as long as the focus stays in the bar, and gives it back once a row is chosen or after a second click on the name of the open menu, the keyboard come by itself keeping the focus on that name; on a computer of Apple, Redo is Cmd+Shift+Z alone. Found by trying it: under a panel, Chromium sent its own undo to the editor (the editor now follows it only while the keyboard is in the code), and two **Comment lines** in a row were one step of the history. 81 checks with the keyboard and the mouse in a headless Chromium on the built website. Two reviews, the second on the fix commit alone: thirteen recommendations, all applied. Left to the backlog: Firefox, Safari and a computer of Apple (step 27), the editor of a level replaced by the next one on the same screen (step 21), the memory of the focus through a window that loses it.

### 16d. Code saved (#74)

The code of each level, and of the sandbox, is saved in the browser at each change and comes back with the level; a browser that refuses to save shows its banner at the first change. **Level › Restore starting code…** puts a level back in its first state: greyed while there is nothing to restore (decided on 2026-11-21, as **Undo**), it opens a confirmation, the first panel opened by a command (`shell/confirmation.svelte`, without its ×, announced as an alert): the question, which names the level by its number and its title or the sandbox by its name, what is lost for good, then **Cancel** and the red button; Enter confirms once let go, Escape, **Cancel** or a click on the veil cancels, and once restored the cursor is in the code with nothing to undo. What is saved has its three modules in `web/src/lib/code/` (`code.ts`, the domain; `saved-code.ts`, one key, `stepwise.code`, each level by its stable name, read again before each save so that another tab on another level loses nothing; `current-code.ts`, the store of the browser), its shape a contract between versions of the website written beside it with its tests. Saved at each change rather than grouped, so no cleanup reads the playground and `fromCore` keeps its rule. The editor says that its code changed (`onchange`) and opens again on a text with a new state (`reopen`), knowing nothing of what is saved. `styles/button.css` holds the button with a text (`is-main`, `is-danger`). `specs.md` gave **Clear all progress** a confirmation that its section *Settings* and the mock-up replace with a button held: fixed. 48 checks with the keyboard and the mouse in a headless Chromium on the built website. Two reviews, the second on the fix commit alone: twelve recommendations, all applied, one of them Enter held down on the row of the menu, which restored the code by itself. Left to the backlog: the same level open in two tabs, a tab still open on an older version of the website.

### 16e. Errors underlined (#75)

The editor checks its code when it opens and half a second after the last change (`editor/checks.ts`), draws a wave under each error and dots under the end of a line longer than 80 characters, and shows what they say under the pointer: the two sentences of an error, what happened in this program then the rule, or the advice of a long line. An error where something is missing at the end of a line is a wave one character wide after the line (decided on 2026-11-22). The sentences of the 53 errors of the checks are in `locales/en/errors.ftl`, read by the owner before the pull request, and written by `errors/error-text.ts`: a table keyed by the code of each error gives its messages their values, so that a code added to the core is refused until it is placed, and each word of another language has its own two sentences. The level screen gives them to the editor (`explain`), which knows no message. The core now gives the name of a name that isn't in snake_case, as every other error of a name does. The notes of the audit: the message of `expression-too-deep` says that its limit counts the blocks around the expression, and a test checks a document made from a text with `\r\n`. One review: nine recommendations, all applied, one of them a test in a real browser added to the list of step 17, since the wait before a check needs a page.

## 17. Running

### 17a. Run the code (#76)

The level screen runs the code of the editor on its map: **Run / Pause / Resume** (one command, named by what it does now), **Step** and **Reset**, by the menu **Run** and by Ctrl+Enter, F10 and Ctrl+Shift+Enter. The code is locked while its program runs or is paused (`editor/lock.ts`), Tab and Shift+Tab included, and the rows of **Edit** are greyed then. `Playback` got the edges that the audit of step 15 asked for, written for the bench of step 14, which went away: a run exists only once the program has started, it asks the page for its own frames, one function runs a step at every speed, the speed is read from outside, and `status` tells a program that ended from one that an error stopped. `Program` (`level-screen/program.ts`) is the program of a screen: it checks the code before it starts, and with an error it puts the map back and runs nothing. Decided on 2026-11-22: **Step**, from stopped, only starts the program, paused before its first line, which the next press runs; a shortcut held down runs its command once, the edits that a code editor repeats aside (`repeats`), and Enter held down presses a button made of an icon once. A run is paused under the message of a window too small, and stays so once the screen is back. Two reviews of the code: a run kept in a signal was freed twice, or never, when a **Reset** or a **Step** and another playground came in one batch, so the run became a plain field and `kept` (`core/core-ready.svelte.ts`) remembers every object it made; a step that throws at a **Step** tells the screen, as at a frame. The review of the animations measured the real page at the normal speed, the only one before step 17b, and found nothing to change (see Execution and Commands of a screen in `docs/technical-choices.md`).

### 17b. Speed (#77)

The speed of the programs is a setting, which the panel of the settings doesn't show: **Run › Speed** opens its five speeds beside it, the one in use marked with a check, and a speed chosen applies at once, to a program that runs too, and in the other tabs where Stepwise is open. It is saved as its value in steps per second, **Instant** by its name, rather than as its place in the list: a speed that the list no longer holds becomes the nearest one that it does (`nearestSpeed`; seen in the review of the probe of step 4c). A row of a menu may now open the values of one thing to choose from beside it: the pointer opens them, **→**, Enter or Space enter them on the one in use, the arrows choose one, **←** or Escape leave them for their row (decided on 2026-11-22, from the live menus of the mock-up). The five speeds were measured with six programs of the sandbox, whose robot acts once every 1 to 4 steps, then on the real page by the review of the animations: kept as they are, to be judged by eye at step 17c, once the line of the next step fills the wait between two moves (see the backlog). From the reviews: at **Instant**, a frame ran whole batches of 1,000 steps and stopped on the same step of any loop whose turn takes 2, 4, 5, 8 or 10 steps, so a batch is now a prime (997), and the robot of a loop of turns is seen moving; Enter or Space held down on a row of a menu typed in the code once the focus was back there, so the bar takes the repeats of the key that ran a row; a save of the settings keeps the fields it doesn't know, so that a tab still open on the version before drops no setting added since. A narrow review of the fixes found them right, with one reserve written at step 17c in the comment of `BATCH` (`run/pace.ts`): nothing guarantees by construction that two frames stop on different steps of a loop, the clock of a real browser does (see Execution in `docs/technical-choices.md`).

### 17c. The run in the editor (#78)

The line of the next step is lit on the whole width of the code and of its margin, with an amber arrow in the margin, and the code scrolls just enough for it to be seen, never to center it; the line where an error stopped the program is marked in red, with a cross in the margin, until the next **Run** or **Reset**, following its line as lines are added or taken away around it and going with its line (decided on 2026-11-22, tried in the editor, rather than at the first change). The three controls stand in the corner of the code, **Run** / **Pause** / **Resume** in one amber button, **Step** and **Reset**, each naming itself with its shortcut in a tip of its own, under the pointer and under the keyboard, closed by Escape; **Step** is greyed while the program runs and keeps the focus; they grow pale while the learner types (`isTyped`, from the kind of each change) and come back once the mouse moves, the keyboard reaches one, or the program starts; a click leaves the keyboard in the code, and the code can scroll past its last line. `shell/icon-button.svelte` got the zone of the controls, a main button in amber, a tip of its own and a greyed look that never fills, as the audit of step 15 asked. The five speeds were judged by eye with the line lit and kept as they are. A code review (Enter in the spaces of the marked line, a line moved over the mark, Ctrl+: that made the controls pale, a tip that couldn't be closed nor hovered, WCAG 1.4.13) and a narrow review of its fixes (a line without text that a change deletes); sent to the backlog: the line of the next step that may stop under the controls in a long program.

### 17d. Status bar (#79)

The status bar under the code says where the program stands, in the color of its state: `Ready`, `Running · Reset to edit`, `Paused at line 5 · Reset to edit` on the amber, `Error at line 3` in the error color, `Ended · map 1 passed` in teal, `Ended · goal not met` on the neutral bar, and `Ended` in the sandbox (`Ended · level done` waits for step 21, which brings every map passed with the same code). It counts the errors that the checks underline, in the color of a colored bar; the steps run, the five squares of the speed, which take no stop of Tab, and the position of the cursor, its column counted in characters as the core counts them, stand on the right, so that nothing moves when the state changes its length (the mock-up first), their figures of one width. When the learner types in a locked code, Tab and the keys of erasing included, or pastes, cuts or drops a text there, the bar holds *"Reset the program to edit your code."* on the amber, then the amber fades under the state (`level-screen/lock-flash.svelte.ts`), 1.6 seconds in all, a new try starting it again; while paused, its text alone changes. Decided on 2026-11-23 after the reviews: the reason held then the amber fading under the state, since a reason that faded with the amber crossed the tone of the bar in Night Desk; the shortcuts of **Edit** stay silent in a locked code. Reviews: a code review and one of the animations (the flash that ended once the code was free again, its end heard on its own animations alone, the number of errors that counts the waves drawn, a bar that hides what wouldn't fit), then a fix of two tries in one frame of the page, which left the reason over the fading amber; sent to the backlog: the status bar in a longer language.

### 17e. Console (#80)

The console under the map is a log of the last **Run**: the lines that `print` wrote, the last 1,000 of them under *"Earlier lines aren’t shown: the console keeps the last 1,000."* (the mock-up first), then the error that stopped the program; or the errors that kept it from starting, under *"Fix these 2 errors to run the program."* A click on an error puts the cursor at its place in the code, the line and the place of each error following the code as the learner changes it, by the rules of the cross of the margin (`editor/follow.ts`). **Reset** keeps the log; **Run**, **Step** from stopped and **Restore starting code…** clear it; the number of errors of the status bar lists the errors of the code as it is now, as **Run** would, without running. The 19 errors while running have their two sentences (`errors/runtime-error-text.ts`), read by the owner, the bridge giving the operators as closed unions; `Playback` tells once per run how the program stopped (`onStopped`), and `Program` owns the log of its console. Lines and columns are written without the commas of the thousands. Decided on 2026-11-23: a log rather than a list that follows the checks, the console alone under its tab until step 19, the messages of the level at step 21. Review: one code review, seven recommendations, all applied.
