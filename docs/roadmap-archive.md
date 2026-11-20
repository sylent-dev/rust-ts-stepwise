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
