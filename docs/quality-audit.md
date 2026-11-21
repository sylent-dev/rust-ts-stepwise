# Quality audit

The audit of step 15 of the [roadmap](../roadmap.md), made on 2026-11-19 on the whole code at `57bd177` (step 14d merged): the Rust core, the bridge, the interface, the CI and the conventions of `CLAUDE.md`. The paths and the line numbers are those of that commit.

It holds the brief of each refactoring of step 15, what a step to come settles first, what is sound and should be copied, and what the audit chose not to change. A step reads its own section only: list the headings first (`grep -n '^#' docs/quality-audit.md`).

## Verdict

The code is sound. No type or component does everything; the dependencies go one way, without a cycle; the core depends on no file format and on nothing of the presentation; the conventions of `CLAUDE.md` hold everywhere (no `#[allow]`, no text written in the code, no file name out of the rule). The Rust core needs almost nothing: no finding of high importance, no bug found in the runtime.

What needs work sits where steps 16 to 22 will copy, nearly all of it in `web/`: the level screen wired twice, `Playback` shaped by the bench, no "command" for the menus, message names that nothing checks.

## Refactorings of step 15

One pull request each, in this order. None changes what the learner sees, except 15c, which changes what the interface reads of an error.

### 15b. Core: public surface, names, errors of the domain of the levels

No behavior changes; the compiler finds every place to change.

- **The constructors of the domain return the error of the file.** `Stroke::new` (`crates/core/src/level/stroke.rs:23`) and `Goals::new` (`level/goals.rs:165`) return `LevelErrorKind`, documented as "What is wrong in a level file" (`level/error.rs:34`), which holds side by side the errors of the format (`Syntax`, `Version`, `RowLength`, `UnknownCharacter`, `GoalsInSandbox`) and the rules of the domain (`EmptyPath`, `ConflictingPaintGoal`, `GoalsMetAtStart`…). The schema itself doesn't leak: `serde` and `toml` stay in `file.rs`, and `world/map.rs` knows nothing of the file. Symptoms: `LevelErrorKind::NotNeighbors` doubles `BuildError::NotNeighbors` and borrows its sentence (`error.rs:132-134`); `LevelErrorKind::Goal(BuildError)` has to say that only two of its six variants happen (`error.rs:70-72`); `NoGoal` is raised in two layers (`build.rs:41`, `goals.rs:210`). To do: one error per constructor, wrapped by the error of the file.

  ```rust
  // level/stroke.rs
  pub enum StrokeError { EmptyPath, NotNeighbors(Point, Point) }
  // level/goals.rs
  pub enum GoalsError {
      OutsideMap(Point), OnWall(Point),
      ConflictingPaint(Point), DuplicateItem(Point),
      NoGoal, MetAtStart, NotEnoughItems { needed: usize, available: usize },
  }
  // level/error.rs: what only a file can have wrong, and the three wrappers
  pub enum LevelErrorKind {
      Syntax(String), Version(u32), MapCount(usize),
      RowLength { .. }, UnknownCharacter { .. }, DuplicateItem(Point), GoalsInSandbox,
      Map(BuildError), Stroke(StrokeError), Goals(GoalsError),
  }
  ```

  Two `From`, so that `build.rs` keeps its `?`. The constants of the format, public in `level.rs:24-33` with no user outside `level/`, go down: `FORMAT_VERSION` into `file.rs`, `WALL` and `FLOOR` into `build.rs`, as `pub(super)`; `MAX_MAPS` stays, a rule of the domain. The sentences (`Display`) stay word for word: they cross the bridge (`crates/wasm/src/level.rs:149`), and two tests pin one each (`level/tests.rs:409`, `web/src/lib/core.spec.ts:234`). About 150 lines, 17 patterns of `level/tests.rs` among them.
- **`pub` means "the bridge uses it".** Every module is `pub mod` while the core has one consumer. `Checked::program()` (`program.rs:18`) becomes `pub(crate)`: the tree is a detail of the core, only the two operators of `ast` stay public, for the runtime errors. `SyntaxError::span()` (`parser/error.rs:20`) is called by two tests only. `GoalNotMet::cell()` (`level/goals.rs:47`) has no caller outside the tests, and the interface sorts the same way by hand (`web/src/lib/map/run-end.ts:34`): remove it with its test, or have the bridge use it. `Goals::paints()` as `pub(super)`, and the re-export of `Stroke` (`level.rs:17`) with it. `tokenize`, `parse` and `checker::check` stay public until step 16 has chosen where the highlighting comes from.
- **A test puts the pipeline together by hand.** `crates/core/tests/level_files.rs:44-52` calls `parse`, then `checker::check`, written before `program::check` existed: it calls `program::check`.
- **Names that say two things.** `step` is a line run, in `specs.md` and in `Machine::step`: `Stroke::steps()` (`level/stroke.rs:48`) becomes `passages()`, the word of `specs.md`; `Map::paint_step` and `erase_step` (`world/map.rs:332`, `349`) become `paint_crossing` and `erase_crossing`. Two `Outcome`: the private one of `interpreter/builtins.rs:17` becomes `Effect`. `Robot::carrying()` builds (`world.rs:49`) where `Goals::carrying()` reads: `Robot::with_item()`. `Place` (`checker.rs:39`) is the context of a statement, while "place" is everywhere else a stretch of the source: `Context`.
- **The four lists of words** (`Keyword`, `ForeignWord`, `Builtin`, `Color`: 47 words) may share a word without anything saying so, the order lexer, parser, checker deciding in silence: a test beside `word_enum.rs`.
- Small: `u32::try_from(…).unwrap_or(u32::MAX)` four times in `lexer.rs` (`:66`, `:101`, `:111`, `:113`); the description of `crates/core/Cargo.toml` names the language only; `world/tests.rs:631` writes `% 3` for the number of colors.

### 15c. Core and bridge: the codes and the places of the errors

What the interface reads of an error, before steps 16 and 17 write the messages and the underlining: the code of an error becomes the name of its message.

- **`TooDeep` holds two rules** (`parser/error.rs:125-129`): the blocks, 50 deep (`specs.md`, Lines and indentation), and the tree, 200 deep, without saying which nor its number, while the runtime errors cross with their limit (`crates/wasm/src/runtime_error.rs:141-162`). Two kinds (`ExpressionTooDeep`, since the error is only raised in an expression and `specs.md` files the rule under Expressions, and `BlocksTooDeep`), each given its `limit` by the bridge. `NumberTooLarge` crosses with the largest number too, as its digits (added by the review of 15c). `web/src/lib/run.spec.ts:529-530` copies 200 and 50 by hand.
- **`WrongArgumentCount`**, so the code `wrong-argument-count`, against "values", the word of `specs.md` ("A call gives exactly as many values"): `WrongValueCount`. Nine places, kept in step by the test `assert_same_names` of the bridge.
- **The place of a name between parentheses covers the parentheses**, tried on the module: `let a = (sidse)` underlines `(sidse)`, while `checker/error.rs:43` says "The span is the name". `ExpressionKind::Name(String)` has no place of its own, and `parenthesized` widens the one of the expression (`parser/expression.rs:132-147`): `ExpressionKind::Name(Name)`, as `Call.function` (six uses).

### 15d. The level screen wired once

`web/src/lib/level-screen/level-screen.svelte` is a grid with three snippets. The wiring is written twice, the same, in `web/src/routes/levels/[number]/+page.svelte:24-70` and `web/src/routes/sandbox/+page.svelte:19-58`: `coreReady()`, the object of the WebAssembly module made in a `$derived` and freed by an `$effect` beside it, the state `playback`, the header, the bench, and `MapBlock` given four fields of the `Playback` one by one. The same five props are declared at three levels (the route, `map-block.svelte`, `map-view.svelte`). Only the source, the goals, the title and its icon differ, and `specs.md` says that the sandbox is "the level screen without goal".

```ts
// lib/level-screen/playground.ts
/** What a level screen plays on: a map of a level, or the sandbox. */
export interface Playground {
	/** The stable name: the one of the level, or `sandbox`; what is saved is saved under it. */
	name: string;
	/** The world at rest. */
	world: World;
	goals?: Goals;
	startingCode: string;
	start(text: string): Run;
}
export function levelPlayground(name: string, level: Level, map: number): Playground;
export function sandboxPlayground(sandbox: Sandbox): Playground;
```

- `level-screen.svelte` takes a `Playground`, a title and an icon, and lays out the header, the column of the code, the map and the panels itself; a route keeps the loading of the file and the title of the tab.
- The map takes one object (`world`, `motion`, `progress`, `outcome`), which a `Playback` satisfies as it is, and shows `playground.world` as soon as the core is ready, before any program.
- The life of an object of the module (made once the core is ready, freed when replaced or when the component leaves) becomes one small function beside `coreReady()`.
- `levels.ts` gives the file of the sandbox, which the route imports by its path today, the name `sandbox` being written in `levels.ts:33` too.
- `Level` and `Sandbox` stay two types in the core and in the bridge (a map of a level without goal must not exist): the adapter is in TypeScript.

No test covers the routes nor the components before Playwright (step 17): try the level and the sandbox by hand, in both themes.

### 15e. Messages

Nothing is written in the code, and today every name of the code is in `web/locales/en.ftl`. Nothing keeps it so: `t(id: string)` takes any text (`web/src/lib/i18n.ts:69`), a wrong name shows itself with a warning in the console, and each module checks its own names its own way (a spy on `console.warn` in `level-menus.spec.ts:42-48`, `hasMessage` on a list elsewhere); the messages read by the components are checked by nothing.

- One test that reads the sources (`import.meta.glob('/src/**/*.{ts,svelte}', { query: '?raw' })`) and `app.html`: each literal name of `t('…')`, `tAround('…')` and `%stepwise.text.…%` exists, and each message of the file is used or belongs to a declared family (`level-*-title`, `theme-*`, `window-small-*`, later `error-*`). It replaces the spy of `level-menus.spec.ts`. A union `MessageId` generated from the file, checked at compile time, is the stronger variant, for the day the families multiply.
- A naming rule at the top of the file, `<zone>-<thing>[-<part>]`, the zone being the block that shows the message; a family whose part comes from data (the name of a level, the code of an error) has a prefix no fixed name uses; each family has its named function, as `titleMessage`. Rename the few names out of the rule: the single words (`sandbox`, `manual`, `settings`, `close`, `map`, `menus`), `page-title`, which shares its prefix with the messages of the page itself, `level-numbered`.
- One file per domain, `locales/en/*.ftl` (the interface, the errors, the levels), all added to the same bundle.

### 15f. `web/src/lib`: a layout rule, shared test helpers

The folders hold: one per block or per domain, with its components, its pure logic and its tests. The root mixes four kinds: what everything imports (`i18n.ts`, `icon.svelte`, `elements.ts`, `platform.ts`), the state of a run (`playback.svelte.ts`, `pace.ts`), the page itself (`page-*.ts`, `startup.ts`), and modules of a screen that has its folder (`level-menus.ts`).

- The rule, in `CLAUDE.md` (Development): a folder per domain or block of the specifications, with its components, its pure logic, its state (`current-*.svelte.ts`), its saved shape (`saved-*.ts`) and its tests; at the root, only what no domain owns and all may import, without the state of a screen; the routes import the folders, never the other way, and `map/` and `core/` import no screen; the same folder by a relative path, another one by `#lib/`.
- The moves: `level-menus.ts` into `level-screen/`; `playback.svelte.ts` and `pace.ts` into `run/`; `page-fill.ts`, `page-parts.ts`, `startup.ts` and their tests into `page/`; `core.ts`, `core-ready.svelte.ts`, `core.spec.ts` and `run.spec.ts` into `core/` (the generated `wasm/` stays where `build-wasm.ts` writes it); `levels.ts` waits for step 21. The paths named in `docs/technical-choices.md` and in the comments of `app.html` and `hooks.server.ts` follow.
- The test helpers written again in each file: the loading of the module (six times: `core.spec.ts:20`, `run.spec.ts:21`, `playback.spec.ts:8`, `levels.spec.ts:9`, `map/paint-motion.spec.ts:18`, `bench/bench-programs.spec.ts:11`), the small levels in TOML (four variants of a corridor), the storage in memory (three times). A `test-support.ts` per folder, as `map/test-support.ts`: `loadTestCore()`, `sandboxOf(terrain)`, `levelOf(map)`, `memoryBackend()`.
- What is saved has a sound pattern, to write where it is described (Browser storage in `docs/technical-choices.md`) with its condition: `<thing>.ts` (the domain), `saved-<thing>.ts` (its saved shape, given its `Store`), `current-<thing>.svelte.ts` (the reactive state), and `current-*` holds no rule, since it opens the store when imported and a test can't replace it.
- Small: `saving` is exported writable (`storage/browser-store.svelte.ts:10`) where `settings` is read-only; `Core.version` (`core.ts:6-8`) is read by nothing; the exclusion of `vite.config.ts:45` matches no file; an address is written two ways (`resolve('/sandbox')` in `routes/+page.svelte:16`, `to: 'sandbox'` in `level-menus.ts`); the header of `pace.ts` tells its history rather than its role.

### 15g. Stricter TypeScript

Not a finding of the audit: added by the owner on 2026-11-19, during step 15c. `web/tsconfig.json` has `strict: true` alone, and ESLint the `recommended` rules of typescript-eslint. The code already follows the stricter rules, by discipline and by its reviews (measured on 2026-11-19 with `tsc` on the `.ts` files: 9 errors in all), but nothing holds it there while steps 16 to 22 write most of the interface. The compiler then holds the interface as Clippy pedantic and the indexing forbidden hold the core.

- **Turn on**: `noUncheckedIndexedAccess` (1 error), which makes `list[0]` and `table[key]` possibly `undefined`, as `clippy::indexing_slicing` does in the core; `noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch` (no error).
- **Try**: `exactOptionalPropertyTypes` (4 errors), which tells a field left out from a field that is `undefined`. Kept unless the types of Svelte fight it; to look at again when step 16 installs CodeMirror.
- **Leave out**: `noPropertyAccessFromIndexSignature` (4 errors), a way of writing that adds no safety to the first.
- **ESLint reading the types**: `strictTypeChecked` of typescript-eslint in place of `recommended`, for every file and not for the Svelte ones alone: an `await` forgotten, a `switch` that leaves out a code of an error or an event of the core (what 15h leans on), a condition that can't be false. A rule too noisy is tuned or turned off in `eslint.config.js`, with its reason; to look at first, `restrict-template-expressions`, which may refuse a number in a template.
- **Not measured**: the `.svelte` files, which `tsc` doesn't read (`npm run check`), the findings of ESLint, and the time of `npm run lint` before and after.
- **Out of reach of them all**: what comes from outside (`localStorage`, a level file) is checked when it is read, as today.
- `docs/technical-choices.md` (Front-end tooling) says "TypeScript in strict mode": it names the options kept and the ones left out, with their reasons.

### 15h. Styles and exhaustive tables

The rule of `CLAUDE.md` holds: no color, text size, radius nor duration outside the tokens.

- **The stacking order is written in figures** in two files that name each other in a comment (`shell/menu-bar.svelte:237`, `styles/screen-message.css:16`, `:38`), and steps 16 to 22 add six layers at least: `--layer-…` in `layout.css`, with their line in `docs/design-system.md`.
- **Three buttons made of an icon alone**, each with its square, its hover and its pair `title` and `aria-label` (`shell/panel.svelte:79`, `shell/storage-banner.svelte:27`, `settings/settings-button.svelte:19`): one component, `shell/icon-button.svelte`. The rule of `CLAUDE.md` then says when a look is a component (the same markup and the same look) and when it is a class of `styles/` (the same look on different elements, or one that `app.html` needs).
- **The colors of the paint are written two ways** (`map/paint-stroke.svelte:49-59` with a class per color, `map/moving-paint.svelte:80`, `:92` with a template), and a fourth color would be drawn without paint, without an error: one table, `satisfies Record<Color, string>`. The same for the events animated: `EVENT_TIMES` as a `Record<StepEvent, number | undefined>`, so that a new event of the core must be placed (`map/motion.ts:47-55`, and the list of `run/playback.svelte.ts:258`).
- Small: values without their reason in their block (`shell/place.svelte:28`, `:44`, `shell/storage-banner.svelte:66`), a size shared by two blocks (`settings/settings-button.svelte:34`, `styles/band.css:9`); the three files of the fonts named in `app.html:39-53` and in `styles/fonts.css`, compared by nothing: a test in `page/page-fill.spec.ts`; a `styles/app.css` that imports the style sheets, as `tokens.css` does, rather than a line each in `+layout.svelte`.
- Left to step 16, with its first button outside a message: `styles/button.css`, the main button being today `.screen-message-action`, in the style sheet of the messages. Done at step 16d (2026-11-21), with the buttons of the confirmation of **Restore starting code**: the class `button`, and `is-main` and `is-danger`.

## To settle first, by step

These findings are true today, but what fixes them depends on code that doesn't exist yet. Each is the first thing its step settles, in its proposal, before the code that would copy the present shape.

### Step 16: the command of a screen

Settled at step 16c (2026-11-21): a command of a screen is written once, a `ScreenCommand` (`web/src/lib/shell/commands.ts`), which its row of a menu and the one listener of the screen read (see Commands of a screen in `docs/technical-choices.md`). The finding was that nowhere did a command, its label, its shortcut and its state live together: `MenuRow` was `LinkRow | HereRow`, `canChoose` told a row that can be chosen by `'to' in row`, and a row ran by the `click()` of its link, while each command will show in four places (the row of a menu, the shortcut heard on the whole screen, the hover of its control, the panel **Keyboard shortcuts**).

What the sketch of the audit became, proved with the commands of the menu **Edit**: a row has a `kind` (`link`, `here`, `command`, `separator`); a shortcut is a character or a named key, each with its rule for Shift, rather than one text; `commandFor` is pure and takes the computer; CodeMirror keeps no key of a command, rather than a keymap built from the same shortcuts, so that no key runs twice; the editor names its edits as a closed list, since it may not import `shell/`.

Left to step 17, with their first use: the row that opens a menu beside it (`submenu`, for **Speed**); a panel opened by a command (**Help › Keyboard shortcuts**), as a state of the screen that the command sets (came first at step 16d, with the confirmation of **Restore starting code…**: the level screen holds whether it is open, and the command sets it), since a panel opens one way only today, from the button that owns its `open` (`settings/settings-button.svelte`); whether a key held down runs a command again; a key named by a word (Enter, Space); the editor locked while a program runs; the tip of a control, which reads the same command. "Command" names two things in `specs.md`, those of the screen and those of the language, and `Action` is taken by `map/motion.ts`.

### Step 16: where the words of the language come out

Settled at step 16a (2026-11-20): the lists of words cross as types that the bridge generates from mirror enums, as `Color` (`crates/wasm/src/word.rs`; see Words of the language in `docs/technical-choices.md`). The finding was that nothing typed came out of the four lists of the core (`word_enum!`), so each table of the interface would have listed the words again, with nothing to keep them in step.

Left to step 20, with its first reader: one exported function of the bridge, built from `ALL`, `vocabulary() -> { keywords, foreignWords, builtins: { name, parameters }[], colors, indentWidth }`. The category of a built-in function stays in the interface, with the structure of the menu.

### Step 16: where the highlighting comes from

Settled at step 16a (2026-11-20): in the core, by a reading of one line that never fails, `lexer::classify_line` (see Colors of the code in `docs/technical-choices.md`). With it, what 15b had left public for this choice is closed: `tokenize`, `parse`, `checker::check` and the tree of `ast`, down to its two operators, which the runtime errors carry and `interpreter` gives.

### Step 16: what a cleanup reads of `fromCore`

Added at step 15d, which wrote `fromCore` (`web/src/lib/core/core-ready.svelte.ts`). It makes the object of the module (a `Level`, the `Sandbox`) in a `$derived` and frees it in the cleanup of an `$effect`. A cleanup, the function an `$effect` returns or `onDestroy`, that reads `current`, or what is derived from it (the `playground` of the level screen, a prop for the blocks of the screen), makes Svelte compute the `$derived` again from the values of before. Tried with Svelte 5.57, two outcomes:

- `make` runs once more, for an object that nothing frees but the garbage collector: a third `Level`, read from the text of level 1, when the screen goes from level 1 to level 2 (the code review of step 15d);
- `current` stops following what `make` reads: after a cleanup read it as the core became ready, a new text made no new object, and the screen would keep the level of before.

Nothing reads it so today: the only cleanup, the one of the bench, uses what its effect read. Step 16 is the first that may: the code is saved as the learner types (see Code editor in `specs.md`), and if the saves are grouped, the last one is written when the screen leaves or changes level, in a cleanup, under `playground.name`.

Two ways, to choose in the proposal of the step:

- **Keep `fromCore` and its rule**, written in its doc comment: an effect reads first what its cleanup will need, a value and not the object, which may be freed by then.

  ```ts
  $effect(() => {
  	const { name } = playground; // read while it is the playground of the screen
  	return () => save(name, text); // the cleanup uses what the effect read, nothing else
  });
  ```

- **Make the object in the `$effect`** and keep it in a `$state.raw`: the trap goes away, but the object arrives a pass later, and during that pass the screen sees the name of the new level with the `Level` of the one before.

The first, unless a cleanup needs more of the playground than a value. Whatever is chosen gets its test in `core-ready.svelte.spec.ts`, where the effects run as in a browser.

Settled at step 16d (2026-11-21): the code is saved at each change, in the handler of the change, rather than grouped, so no cleanup reads the playground. `fromCore` keeps its rule, written in its doc comment, and the test of the rule, added at step 15f (*makes nothing more for an effect whose cleanup uses what the effect read first*).

### Step 17: the edges of `Playback`

The engine is right and tested: one clock for the steps and their animations, `timeAt`, `now` and `lessMotion` injected, 38 tests through the public API and `tick(time)`. Five assumptions come from the bench (`web/src/lib/run/playback.svelte.ts`):

1. **A run always exists.** The constructor and `reset()` call `start()` (`:116`, `:170`), which throws for a program with errors; and the map at rest comes from `playback.world` alone. With the editor, the map shows while the code has errors, and **Reset** after a change of the code would throw.
2. **The clock is elsewhere.** `tick()` runs only if someone asks for the frames: `wake()` of the bench (`bench/bench.svelte:33-40`), which each command must remember to call. Step 17 has three callers at least: the controls, the shortcuts, the menu **Run**.
3. **Nothing comes out of a step but for the map.** The line printed is lost (`:250-260`), and the loop of **Instant** drops the event (`:283-286`): two paths run a step, and the console (17), the breakpoints (19) and the sounds (18) would be added to both. `run.calls()` can't be reached.
4. **The speed belongs to the `Playback`** (`:81`), made again for each program: the bench keeps a copy to give it back. It is a setting, kept between sessions.
5. **`status` is derived from `steps > 0`** (`:127-131`): a program paused before its first step would read as `ready`.

Keep the class, its `tick` and its tests; change its edges. A sketch:

```ts
export interface PlaybackSource {
	/** The world before any step: what the map shows at rest, the program valid or not. */
	world: World;
	/** Starts a run of the program as it is now; the screen checked it before. */
	start(): Run;
}
export interface PlaybackOptions {
	rate: () => number; // read at each frame: the setting
	frames?: (tick: (time: number) => void) => () => void; // requestAnimationFrame by default
	onPrinted?: (line: string) => void; // each print, Instant included
	pausesBefore?: (line: number, afterCall: boolean) => boolean; // the breakpoints (19)
}
```

The run becomes optional (`reset()` frees it and puts `source.world` back; `play()` and `step()` start it); one private step, called by the animated path and by the loop of **Instant**, where what comes out of a step lives; `play()` and `step()` ask for their own frames, `tick` staying public for the tests; `calls()` for step 19; `NORMAL_SPEED` beside `SPEEDS` in `pace.ts`. Don't touch the pacing of `tick` (`#carry`, `#waiting`). `map/motion.ts` holds two things, the vocabulary and the times (lines 1-148) and the pose (150-277): the sounds need the first alone.

Since step 15d, the level screen holds a `Playground` (`level-screen/playground.ts`), which gives the world at rest and starts a run from a text: the source of a `Playback` is the playground of the screen and the text of the editor. The screen then makes the `Playback` itself, where the bench makes it and hands it over by a binding: a playback must never outlive its playground on the map, which the tabs of the maps (step 21) change while the screen stays. Today the map takes its scene and its goals from two sources (`playback ?? playground` and `playground?.goals`), and for one pass that is never painted, a new playground shows with the playback of the one before.

Two things to decide with it:

- **"Ended" has three meanings.** `State::Ended` in the core: the program ran to its end, without error. `Outcome.type === 'ended'`: it did so in the sandbox. `PlaybackStatus 'ended'` and `Playback.ended`: any stop, an error included; and `RunEnd`, `runEnd()` and `map/run-end.ts` are the animation of `passed` and `goals-not-met` alone. The status bar tells `Error at line 3` from `Ended`: one name each.
- **Step from the start.** `specs.md` (Running a program) says "from stopped, it starts the program paused on its first step"; `Playback.step()` runs the first step (`:156-165`). The sentence reads both ways: ask the owner.

### Step 18: the group of the errors of the robot

The core holds the five failures of the robot under one variant (`RuntimeErrorKind::Robot`); the bridge flattens them into five codes, each with its message (`crates/wasm/src/runtime_error.rs:150-156`); the interface writes the group again by hand (`RobotFailure`, `web/src/lib/map/motion.ts:25-28`), and a sixth error would cross the bridge and stay out of it, without animation nor sound. The sounds read `robotFailure()` (`motion.ts:97`), which then leaves `map/`, never a second list; safer, the bridge gives the group as a generated type, so that `FAILURE_TIMES satisfies Record<RobotError, number>` fails the check (to verify: that `tsify` writes the type of an enum no exported function returns).

### Step 20: the names at the cursor

What the checker knows of the names is private and dropped at the end of its walk: the functions of the program with the place of their definition (`crates/core/src/checker/functions.rs`), the variables visible at a place (`checker/scope.rs`). Ctrl+click on a function of the program (step 16) and **Your names** (step 20) need it; and `let total = ` followed by Ctrl+Space is a syntax error, so `parse` gives no tree when the menu must propose names. The rule of the scopes is written twice already (the checker, the slots of the compiler): in `web/`, it would be a third time, out of reach of the tests of the core. A query of the core beside `check`, which reuses the two modules:

```rust
pub struct ProgramFunction { pub name: String, pub defined: Span, pub parameter_count: usize }
pub struct NamesAt { pub variables: Vec<String>, pub functions: Vec<ProgramFunction> }
pub fn names_at(source: &str, position: Position) -> NamesAt
```

A statement fits on a line and the lexer reads line by line: the line of the cursor can be set aside, without a parser tolerant everywhere.

### Step 23: the harness of the solutions

`crates/core/tests/level_files.rs` walks `web/levels/` and checks each file and its starting code; `crates/core/tests/programs.rs` runs a program on each map of a level and tells how it ends (`run` and `End`, lines 25-66), on three trial levels only: they share nothing, and the draft level of the website is solved by no test. Join them (one file, since a module shared by two test targets raises `dead_code` in the one that doesn't use everything), then for each level of the folder: a solution that exists, passes every map, and a starting code that passes none. Where the solutions live is to decide with the owner (for instance `crates/core/tests/solutions/<stable-name>.txt`).

### Smaller notes

- **Step 16**: the `limit` of `expression-too-deep` counts the blocks around the expression (an expression of 151 levels under 50 blocks has this error): its message says so, as `specs.md` does.
- **Step 16**: the layout of `web/src/lib` (15f; see Development in `CLAUDE.md`) is checked by ESLint on the imports written with `import … from` alone, so `import()` of a file of the project is refused (`no-restricted-syntax` in `web/eslint.config.js`). If the editor is to load on demand, settle it in the proposal of the step: `import('codemirror')`, a package, passes as it is; a file of `#lib/` loaded that way needs a place made for it in the configuration, for that one case and with its reason. The editor gets a folder of its own beside `level-screen/` (`editor/`), since a folder holds no sub-folder.
- **Step 16**: the stacking order is a list of named layers (`--layer-…` in `styles/layout.css`, 15h; see Layers in `docs/design-system.md`). CodeMirror stacks what it draws with figures of its own (its tips, its panels): check them against the layers when the editor arrives, so that a tip of the editor never shows over a message in place of the screen. The first button outside a message brings `styles/button.css`, the main button being today `.screen-message-action`.
- **Steps 16 to 22**: a button made of an icon alone is `shell/icon-button.svelte` (15h), which takes the zone it stands on and is placed by the block that shows it. A zone it doesn't know yet (the bubble of the goal, step 21) is a line of its table (`LOOKS`: the icon, the square, the fill), and a class of its styles only for what the zone doesn't share with the others, never a button written again in a block. Two cases of the mock-up will ask for a touch of the component: a tip that says more than the name (`block-manual.js:67`, *Stop and go back to the start* for **Stop**), as an optional `tip` that is the `label` by default, rather than `title` let through again; a button that can't be clicked, which takes `disabled` today but still fills under the pointer (`button:not(:disabled):hover`, and a look at rest).
- **Steps 16 to 22**: a test that replaces a module names it by a text (`vi.mock('./core.ts', …)`, as `core/core-ready.svelte.spec.ts` does). The typed forms of Vitest, `vi.mock(import('./x.ts'), …)` and `importActual<typeof import('./x.ts')>()`, are refused by the same checks.
- **Step 17**: a panel closes under the message of the page by following `currentPage.failed` (`page/startup.svelte.ts`, 15h), which knows the message that the application asked for, not one that the page keeps by itself. In a browser without WebAssembly, the page keeps its own on the screens that don't load the core (the home screen, the manual), and what it puts out of reach still hears a key on the window (`<svelte:window onkeydown>`). If a shortcut opens a panel on such a screen, the page answers `started()` with what it keeps, rather than a second detection in the application.
- **Step 19**: the lines that start a step (see the backlog, a breakpoint on a line that never starts one) are known by `Code` (its `Instruction::Line`) and by the test helper `lines_run` (`crates/core/src/interpreter/tests.rs:218`): the function of the core reads `Code`, and `lines_run` stays the independent oracle.
- **Step 21**: `chapters.toml` copies the three parts of `level/` (the schema, the building, the domain) with the errors of 15b, and `file::parse<T: Versioned>` (`level/file.rs:122`) reads it as it is. "What the learner used" on the success panel is a walk of the checked tree, in the core. The rules of the progress go in `progress.ts` and `saved-progress.ts`, never in `current-progress.svelte.ts` (see 15f).
- **Step 23**: one sentence of the errors of a level file is tested, of about twenty; read them all once, since the owner will meet them while writing the levels.
- **The French translation**: `t()` isn't reactive and several labels are computed once (`settings/settings-panel.svelte:16`, `shell/window-message.svelte:18`), so changing the language reloads the page.

## What is sound, to copy

- **A pure function, then a component that draws**: `menus.ts` and `menu-bar.svelte`, `segments.ts` and `segments.svelte`, `window-size.ts` and `window-message.svelte`, `store.ts` and `browser-store.svelte.ts`, `motion.ts` and `map-view.svelte`. What can break is tested without a browser: the pattern for the editor, the console and the status bar.
- **An animation is a function of two worlds and a time**, the map holding no state: `map-view.svelte` serves the manual and the home screen as it is.
- **Exhaustive tables**: `satisfies Record<AnimatedEvent, number>` in TypeScript, a `match` without `_` in Rust (`Instruction::set_target`, `builtins::call`). A name without its value doesn't compile.
- **Types that can't hold an invalid state**: `Checked`, the one way to the machine; `Outcome::Failed`, which leaves the goals out; `Option<Tool>` rather than two booleans; `PendingJump`, `#[must_use]`.
- **An error is a code with its values and its place, never a sentence**, of the same shape (`{ kind, span }`) at the four stages; the limits of the language cross with the error they stop.
- **One module per border**: `core.ts` for the bridge, `elements.ts` for the drawings, `store.ts` for `localStorage`, `startup.svelte.ts` for the script of the page, `i18n.ts` for the texts, `position.rs` for the places.
- **What depends on the outside is given**: the `Backend` of the store, the clock, the times and the less motion of `Playback`, the files of `listLevels`.
- **`word_enum!`**: a word, a line; the pattern for any closed list of words.
- **Tests by the behavior**: the interpreter by whole programs, the parser by a form written back (`show`) rather than by the shape of the tree, two tests with an independent model (20,000 random programs, the painted passages). They would survive a rewrite.
- **The budget of instructions of a step** (`interpreter/machine.rs:158-185`): written in the compiler, checked on every program the tests run, guarded while running. An infinite loop never freezes the page.

## What the audit chose not to change

- **The checker doesn't annotate the tree.** The compiler derives the names again, in about thirty lines, and falls back on `Internal` where the checker should have refused; a test of random checked programs keeps both in step. An annotated tree would tie the checker to the memory of the machine.
- **The `match` of the interpreter stays in `memory.rs`**, where the borrows put it; `machine.rs` is its public face.
- **The mirror enums of the bridge** (the 52 errors written a second time): decided, and its reasons hold; they are what generates the TypeScript types.
- **`Level` and `Sandbox` stay two types**, in the core and in the bridge.
- **`check` has two scopes** (`program::check`, the checks before running; `checker::check`, their second half): renaming costs more than it brings.
- **`level/tests.rs` tests the domain through TOML**: `Goals::new` takes six arguments by position, and reads worse than the excerpts.
- **A run is tested at three levels** (the core, the bridge in Rust, the bridge through the module in TypeScript): each checks its own crossing.
- **The bench** leaves at step 17: of it, only the loop of the frames and the single button whose label changes, which keeps the focus, are worth keeping.
