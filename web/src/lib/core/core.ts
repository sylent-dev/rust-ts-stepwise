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
 * The words of the language that an error carries (see crates/wasm/src/word.rs), the operators
 * among them, each list a union of the words as they are written: a table keyed by one of them, written
 * `satisfies Record<ForeignWord, …>`, names every word, and a word added to the core is refused
 * until it is placed. The colors have their type with the world (`Color`).
 */
export {
	type BinaryOperator,
	type Builtin,
	type ForeignWord,
	type Keyword,
	type UnaryOperator
} from '#lib/wasm/stepwise.js';

/**
 * What the interface reads of the language at runtime (see crates/wasm/src/vocabulary.rs), to
 * call once `loadCore` has resolved: each built-in function with the number of values that a call
 * gives it (none for `print`, which takes any number), in the order of the specifications, and
 * the number of spaces that a block is indented by. A new object at each call: read it once.
 */
export { type BuiltinFunction, type Vocabulary, vocabulary } from '#lib/wasm/stepwise.js';

/**
 * The names that a line written at the cursor may use (see crates/wasm/src/names.rs), to call
 * once `loadCore` has resolved: the functions of the program defined above the cursor, then the
 * variables that exist there, each in the order of the program and with the place of its name;
 * or, when a syntax error above the cursor hides them, the line of that error. The cursor is an
 * offset in the text, as the editor gives it. Only the lines above it are read, nothing of its
 * own line, which is being written. Give it the text of the document of the editor, as `check`.
 */
export {
	namesAt,
	type NamesAt,
	type ProgramFunction,
	type ProgramVariable
} from '#lib/wasm/stepwise.js';

/**
 * What each stretch of a line of code is (see crates/wasm/src/stretch.rs), to call once
 * `loadCore` has resolved: a keyword, a function, a number, a text, a color, a comment…, from
 * left to right, the spaces left out, and any blank character before the first stretch. It is
 * how the code gets its colors: the core reads the line as it reads a program, so no rule of
 * the language is written here.
 *
 * It takes one line, without its line break, and never fails: a line being typed is wrong most
 * of the time. A statement never spans two lines, so a line is read alone, whatever is around
 * it. A stretch is `line.slice(from, to)`, never empty. A text cut on `\n` may leave a `\r` at
 * the end of a line: it is taken as part of the line break, as the checks do.
 */
export { classifyLine, type Stretch, type StretchKind } from '#lib/wasm/stepwise.js';

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
 * The lines of a program where a step starts (see crates/wasm/src/run.rs), to call once
 * `loadCore` has resolved: those a breakpoint can pause it on, from 1, in order and each once;
 * `undefined` when the checks refuse the program, since nothing can run then. Every statement
 * but the definition of a function, and each `else if`: never an `else:`, a blank line nor a
 * comment. It checks the text again at each call: call it for a press of the learner, never at
 * each step.
 */
export { stepLines } from '#lib/wasm/stepwise.js';

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
 * `outcome()`, `calls()` and `variables(call)` give are plain objects built again at each call:
 * read them when they are needed (once per frame, at a pause), and keep the world in `$state.raw`.
 * `calls()` lists the calls in progress, each with its line and its number, and `variables(call)`
 * gives those of one call, by its index among them: it throws for an index that has no call. A
 * value is written as in a program, a text between its quotes, its first 200 characters at most
 * (`cut` then says that there are more).
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
	type RobotError,
	type RuntimeError,
	type RuntimeErrorKind,
	type StepEvent,
	type Value,
	type ValueType,
	type Variable
} from '#lib/wasm/stepwise.js';
