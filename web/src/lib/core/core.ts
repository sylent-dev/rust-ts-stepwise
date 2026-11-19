// The core of Stepwise, compiled to WebAssembly by `npm run wasm` (see scripts/build-wasm.ts).

import init from '#lib/wasm/stepwise.js';

/**
 * Loads the WebAssembly module, fetched once whatever the number of calls. A failure is written
 * to the console with its cause, then passed on to the page, which says it.
 */
export async function loadCore(): Promise<void> {
	try {
		await init();
	} catch (error) {
		console.error('core: the WebAssembly module could not load', error);
		throw error;
	}
}

/**
 * The checks before running (see crates/wasm/src/check.rs), to call once `loadCore` has resolved:
 * the errors of a program, each with its place and its kind, a code with its values.
 *
 * A place is given in the text that was checked: `text.slice(span.from, span.to)`. Always check
 * the text of the document of the editor, never a text from elsewhere: the editor counts one unit
 * for every line break, so the places of a text with `\r\n` would not be those of its document.
 */
export {
	check,
	type ProgramError,
	type ProgramErrorKind,
	type ReservedKind,
	type Span
} from '#lib/wasm/stepwise.js';

/**
 * The levels and the sandbox (see crates/wasm/src/level.rs and world.rs), to create once
 * `loadCore` has resolved: `new Level(toml)` and `new Sandbox(toml)` read the text of a file of
 * `web/levels/`, and throw an `Error` with the reason, in English, when it isn't valid.
 *
 * A level stays in the module: free it once its screen closes (`using`, or `free()`), and don't
 * call it afterwards. What it gives (`maps()`, `world()`) are plain objects, built again at each
 * call: read them once and keep them, in a component in `$state.raw`, since a world is never
 * changed but replaced whole, and `$state` would wrap each of its cells in a proxy.
 */
export {
	Level,
	Sandbox,
	type Cell,
	type Color,
	type Direction,
	type Goals,
	type LevelMap,
	type Paint,
	type PaintGoal,
	type Point,
	type Robot,
	type Tool,
	type World
} from '#lib/wasm/stepwise.js';

/**
 * A program being run (see crates/wasm/src/run.rs): `level.start(map, text)` and
 * `sandbox.start(text)` give a `Run` paused before its first line, on its own copy of the world.
 * Check the text first: they throw for a program that has errors. The places of an error while
 * running are those of that text, as for `check`.
 *
 * `step()` gives a word and `line`, `afterCall` and `steps` a number or a boolean: they are cheap
 * enough to be read after every step, even at **Instant**. `line` is `undefined` once the program
 * has stopped, at its end or on an error: `outcome()` then says how. `printed()` gives the line
 * of the last step, a text that may be empty, when `step()` gave `printed`. What `world()`,
 * `outcome()` and `calls()` give are plain objects built again at each call: read them when they
 * are needed (once per frame, at a pause), and keep the world in `$state.raw`.
 *
 * A run stays in the module, as its level, which it outlives: free it at **Reset** and before
 * starting another one (`using`, or `free()`), and don't call it afterwards: it throws. An
 * animation frame asked before **Reset** must not step a run that was freed since.
 */
export {
	Run,
	type Call,
	type GoalNotMet,
	type Outcome,
	type RuntimeError,
	type RuntimeErrorKind,
	type StepEvent,
	type Value,
	type ValueType,
	type Variable
} from '#lib/wasm/stepwise.js';
