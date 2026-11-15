// A program run through the module the interface loads, called from TypeScript as the level
// screen will: started on a map, run one step at a time, read after each step and at its end.
// The rules of the language and of the goals are tested in the core; these tests check that
// they cross the bridge as they are.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	check,
	initSync,
	Level,
	Sandbox,
	type Cell,
	type ProgramErrorKind,
	type Run,
	type RuntimeErrorKind,
	type StepEvent
} from '#lib/wasm/stepwise.js';

initSync({ module: readFileSync(new URL('./wasm/stepwise_bg.wasm', import.meta.url)) });

/** The most steps a program of these tests runs, unless it says otherwise. */
const MAX_STEPS = 10_000;

/** The file of a level of one map, the body of its `[[maps]]` table. */
function levelOf(map: string): string {
	return `version = 1\nstarting_code = ''\n\n[[maps]]\n${map}`;
}

/** A corridor of four cells, an item to carry from its second cell to its last. */
const CORRIDOR = levelOf(`
terrain = '....'
robot = { at = [0, 0], facing = "east" }
items = [[1, 0]]

[maps.goals]
robot_at = [3, 0]
items_at = [[3, 0]]
carrying = false
`);

/** A sandbox of two cells, for the programs that don't look at the map. */
const SMALL_SANDBOX = `version = 1\nstarting_code = ''\n\n[map]\nterrain = '..'\nrobot = { at = [0, 0], facing = "east" }\n`;

/** What a program did, step after step. */
interface Steps {
	/** The line highlighted before each step. */
	lines: number[];
	/** What each step showed. */
	events: StepEvent[];
	/** The lines written by `print`. */
	printed: (string | undefined)[];
}

/** Runs `run` until the program stops, as the loop of the level screen will. */
function finish(run: Run): Steps {
	const steps: Steps = { lines: [], events: [], printed: [] };
	for (let line = run.line; line !== undefined; line = run.line) {
		if (steps.lines.length >= MAX_STEPS) {
			throw new Error(`the program still runs after ${MAX_STEPS} steps`);
		}
		steps.lines.push(line);
		const event = run.step();
		steps.events.push(event);
		if (event === 'printed') {
			steps.printed.push(run.printed());
		}
	}
	return steps;
}

/** Runs `run` until `line` is the next line to run. */
function runToLine(run: Run, line: number): void {
	for (let steps = 0; run.line !== line; steps += 1) {
		if (run.line === undefined || steps >= MAX_STEPS) {
			throw new Error(`the program never reaches the line ${line}`);
		}
		run.step();
	}
}

/** What `source` prints in a small sandbox, run to its end without error. */
function printedBy(source: string): (string | undefined)[] {
	using sandbox = new Sandbox(SMALL_SANDBOX);
	using run = sandbox.start(source);
	const { printed } = finish(run);
	expect(run.outcome()).toStrictEqual({ type: 'ended' });
	return printed;
}

describe('a program run on a map of a level', () => {
	it('runs one step at a time, each step giving the line it ran and what it showed', () => {
		using level = new Level(CORRIDOR);
		using run = level.start(0, 'forward()\npick_up()\nrepeat 2:\n    forward()\ndrop()\n');
		expect({ line: run.line, steps: run.steps, outcome: run.outcome() }).toStrictEqual({
			line: 1,
			steps: 0,
			outcome: undefined
		});
		// The line of the `repeat` runs again at each turn, and a last time when the loop ends.
		expect(finish(run)).toStrictEqual({
			lines: [1, 2, 3, 4, 3, 4, 3, 5],
			events: ['moved', 'picked-up', 'nothing', 'moved', 'nothing', 'moved', 'nothing', 'dropped'],
			printed: []
		});
		expect({ line: run.line, steps: run.steps }).toStrictEqual({ line: undefined, steps: 8 });
		expect(run.outcome()).toStrictEqual({ type: 'passed' });
	});

	it('gives the world as the program has changed it so far', () => {
		using level = new Level(CORRIDOR);
		using run = level.start(0, 'forward()\npick_up()\nforward()\nforward()\ndrop()\n');
		const empty: Cell = { type: 'floor', item: false };
		run.step();
		run.step();
		// The item is in the bay of the robot: no cell has it.
		expect(run.world()).toStrictEqual({
			width: 4,
			height: 1,
			cells: [empty, empty, empty, empty],
			robot: { position: { x: 1, y: 0 }, direction: 'east', carrying: true }
		});
		finish(run);
		expect(run.world()).toStrictEqual({
			width: 4,
			height: 1,
			cells: [empty, empty, empty, { type: 'floor', item: true }],
			robot: { position: { x: 3, y: 0 }, direction: 'east', carrying: false }
		});
	});

	it('gives the goals not met once the program has ended, each with its cell', () => {
		using level = new Level(CORRIDOR);
		// Nothing runs: the program ends before any step.
		using empty = level.start(0, '# Nothing yet\n');
		expect({ line: empty.line, steps: empty.steps }).toStrictEqual({ line: undefined, steps: 0 });
		expect(empty.outcome()).toStrictEqual({
			type: 'goals-not-met',
			goals: [
				{ type: 'robot-not-at', at: { x: 3, y: 0 } },
				{ type: 'item-missing', at: { x: 3, y: 0 } }
			]
		});
		// What the robot carries has no cell.
		using carrying = level.start(0, 'forward()\npick_up()\nforward()\nforward()\n');
		finish(carrying);
		expect(carrying.outcome()).toStrictEqual({
			type: 'goals-not-met',
			goals: [{ type: 'item-missing', at: { x: 3, y: 0 } }, { type: 'carrying' }]
		});
	});

	it('paints and erases the cells and their passages on the map', () => {
		using level = new Level(
			levelOf(`
terrain = '''
...
...
'''
robot = { at = [0, 0], facing = "east" }
paints = [{ color = "blue", path = [[0, 1], [1, 1], [2, 1]] }]

[maps.goals]
robot_at = [0, 1]
paints = [{ color = "red", path = [[0, 0], [1, 0], [2, 0]] }]
nothing_else_painted = true
`)
		);
		// A red stroke along the first row, then back along the second one, the eraser down on
		// its first two cells only.
		const source = `start_painting(red)
forward()
forward()
stop_painting()
turn_right()
forward()
turn_right()
start_erasing()
forward()
stop_erasing()
forward()
`;
		using run = level.start(0, source);
		expect(finish(run).events).toStrictEqual([
			'started-painting',
			'moved',
			'moved',
			'stopped-painting',
			'turned-right',
			'moved',
			'turned-right',
			'started-erasing',
			'moved',
			'stopped-erasing',
			'moved'
		]);
		const erased: Cell = { type: 'floor', item: false };
		expect(run.world()).toStrictEqual({
			width: 3,
			height: 2,
			cells: [
				{ type: 'floor', paint: { color: 'red', passages: ['east'] }, item: false },
				{ type: 'floor', paint: { color: 'red', passages: ['east', 'west'] }, item: false },
				{ type: 'floor', paint: { color: 'red', passages: ['west'] }, item: false },
				// The blue cell that is left lost its passage with the cell erased next to it.
				{ type: 'floor', paint: { color: 'blue', passages: [] }, item: false },
				erased,
				erased
			],
			robot: { position: { x: 0, y: 1 }, direction: 'west', carrying: false }
		});
		expect(run.outcome()).toStrictEqual({
			type: 'goals-not-met',
			goals: [{ type: 'painted-elsewhere', at: { x: 0, y: 1 } }]
		});
	});

	it('starts on the map asked, each run from the world of the map as it starts', () => {
		const twoMaps = `${CORRIDOR}\n[[maps]]\nterrain = '..'\nrobot = { at = [0, 0], facing = "east" }\n\n[maps.goals]\nrobot_at = [1, 0]\n`;
		using level = new Level(twoMaps);
		const start = level.maps().map((map) => map.world);
		for (let turn = 0; turn < 2; turn += 1) {
			using run = level.start(1, 'forward()\n');
			finish(run);
			expect(run.outcome()).toStrictEqual({ type: 'passed' });
		}
		// The same program only walks one cell of the first map, and the level still gives its
		// maps as they start.
		using first = level.start(0, 'forward()\n');
		finish(first);
		expect(first.outcome()?.type).toBe('goals-not-met');
		expect(level.maps().map((map) => map.world)).toStrictEqual(start);
	});

	it('keeps running once its level is freed', () => {
		const level = new Level(CORRIDOR);
		using run = level.start(0, 'forward()\npick_up()\nforward()\nforward()\ndrop()\n');
		level.free();
		finish(run);
		expect(run.outcome()).toStrictEqual({ type: 'passed' });
	});

	it('throws for a program with errors or a map the level does not have', () => {
		using level = new Level(CORRIDOR);
		const refused = new Error('the program has errors: check it before starting it');
		expect(() => level.start(0, 'forward(\n')).toThrow(refused);
		expect(() => level.start(0, 'forwrad()\n')).toThrow(refused);
		expect(() => level.start(1, 'forward()\n')).toThrow(
			new Error('the level has no map 1: it has 1')
		);
		using sandbox = new Sandbox(SMALL_SANDBOX);
		expect(() => sandbox.start('forwrad()\n')).toThrow(refused);
	});
});

describe('a program run in the sandbox', () => {
	it('ends without any goal', () => {
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start('forward()\n');
		expect(finish(run).events).toStrictEqual(['moved']);
		expect(run.outcome()).toStrictEqual({ type: 'ended' });
	});

	it('gives each line printed as it is written, read after its step', () => {
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start('print("côté 🤖", 3, true, red)\nforward()\nprint(1 + 1)\n');
		expect(run.printed()).toBeUndefined();
		expect(run.step()).toBe('printed');
		expect(run.printed()).toBe('côté 🤖 3 true red');
		// The line is gone once another step has run.
		expect(run.step()).toBe('moved');
		expect(run.printed()).toBeUndefined();
		expect(run.step()).toBe('printed');
		expect(run.printed()).toBe('2');
	});

	it('gives the empty line of a print without value, which is still a line', () => {
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start('print()\nforward()\n');
		expect(run.step()).toBe('printed');
		// An empty text, not `undefined`: the word of the step says that a line was printed.
		expect(run.printed()).toBe('');
		expect(run.step()).toBe('moved');
		expect(run.printed()).toBeUndefined();
	});

	it('gives the line of a print whose step stops the program', () => {
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start('let line = print("x")\nforward()\n');
		// One step: the line is printed, then the `let` finds no value.
		expect(finish(run)).toStrictEqual({ lines: [1], events: ['printed'], printed: ['x'] });
		expect(run.printed()).toBe('x');
		const outcome = run.outcome();
		expect(outcome?.type === 'failed' ? outcome.error.kind : undefined).toStrictEqual({
			code: 'no-value',
			function: 'print'
		});
	});

	it('keeps running a program that never ends, its steps counted', () => {
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start('while true:\n    turn_left()\n');
		let turns = 0;
		for (let step = 0; step < 30_000; step += 1) {
			turns += run.step() === 'turned-left' ? 1 : 0;
		}
		expect({ turns, steps: run.steps, line: run.line }).toStrictEqual({
			turns: 15_000,
			steps: 30_000,
			line: 1
		});
		expect(run.outcome()).toBeUndefined();
		expect(run.world().robot.direction).toBe('east');
	});

	it('runs the file of the website with its starting code', () => {
		const file = readFileSync(new URL('../../levels/sandbox.toml', import.meta.url), 'utf8');
		using sandbox = new Sandbox(file);
		using run = sandbox.start(sandbox.startingCode());
		finish(run);
		expect(run.outcome()).toStrictEqual({ type: 'ended' });
	});
});

describe('an error while a program runs', () => {
	it('stops the program on its line, its place cut where JavaScript counts it', () => {
		// An accent is one unit for JavaScript, an emoji two: the core counts one character for
		// each, and the error of the last line is after both.
		const source = `# Le côté du carré 🤖
let side = "côté 🤖"
print(side, "🤖🤖")
print("é🤖", 10 / (3 - 3))
print("never")
`;
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start(source);
		expect(finish(run)).toStrictEqual({
			lines: [2, 3, 4],
			events: ['nothing', 'printed', 'nothing'],
			printed: ['côté 🤖 🤖🤖']
		});
		const outcome = run.outcome();
		expect(outcome).toStrictEqual({
			type: 'failed',
			error: { span: { line: 4, from: 76, to: 88 }, kind: { code: 'division-by-zero' } }
		});
		// Only a run that failed has an error: this line compiles because the type narrows it.
		const span = outcome?.type === 'failed' ? outcome.error.span : undefined;
		expect(source.slice(span?.from, span?.to)).toBe('10 / (3 - 3)');
		// The step that stopped the program is counted, and the world stays as it was.
		expect(run.steps).toBe(3);
		expect(run.step()).toBe('nothing');
		expect(run.steps).toBe(3);
	});

	it('is placed in the text it was given, a line break with a carriage return included', () => {
		const source = 'let side = "côté 🤖"\r\nprint("🤖", 1 / 0)\r\n';
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start(source);
		expect(finish(run).lines).toStrictEqual([1, 2]);
		const outcome = run.outcome();
		const span = outcome?.type === 'failed' ? outcome.error.span : undefined;
		expect(span?.line).toBe(2);
		expect(source.slice(span?.from, span?.to)).toBe('1 / 0');
	});

	it('can follow the action of the same step, which is shown all the same', () => {
		using level = new Level(CORRIDOR);
		using run = level.start(0, 'if forward():\n    print("moved")\n');
		// One step: the robot moves, then the condition finds no value.
		expect(finish(run).events).toStrictEqual(['moved']);
		expect(run.world().robot.position).toStrictEqual({ x: 1, y: 0 });
		expect(run.outcome()).toStrictEqual({
			type: 'failed',
			error: {
				span: { line: 1, from: 3, to: 12 },
				kind: { code: 'no-value', function: 'forward' }
			}
		});
	});

	it('has no code that is also one of the checks before running', () => {
		// Checked by `npm run check`: the type is `never` when no code is in both unions, and
		// the brackets keep TypeScript from spreading the condition over `never`.
		type CodeInBoth = Extract<RuntimeErrorKind['code'], ProgramErrorKind['code']>;
		const noCodeInBoth: [CodeInBoth] extends [never] ? true : false = true;
		expect(noCodeInBoth).toBe(true);
	});

	it('gives the values its message needs: types, an operator, a number, a function, a limit', () => {
		// As many characters as a text or a line of `print` holds, each an accent or an emoji.
		const longest = 'é🤖'.repeat(500);
		const kinds = [
			'print("Sides: " + 4)\n',
			'repeat 0 - 3:\n    forward()\n',
			'start_painting(3)\n',
			'forward()\nforward()\n',
			`let line = "${longest}" + "x"\n`,
			`print("${longest}", "x")\n`
		].map((source) => {
			using sandbox = new Sandbox(SMALL_SANDBOX);
			using run = sandbox.start(source);
			finish(run);
			const outcome = run.outcome();
			return outcome?.type === 'failed' ? outcome.error.kind : undefined;
		});
		expect(kinds).toStrictEqual([
			{ code: 'binary-operands', operator: '+', left: 'text', right: 'number' },
			// A whole number of the program crosses as its digits.
			{ code: 'negative-repeat-count', count: '-3' },
			{ code: 'value-not-color', function: 'start_painting', found: 'number' },
			{ code: 'bump' },
			// A limit of the language comes with the error that it stops.
			{ code: 'text-too-long', limit: 1000 },
			{ code: 'line-too-long', limit: 1000 }
		]);
	});
});

describe('the calls in progress of a program', () => {
	it('give their lines and their variables, the ones the last step wrote marked', () => {
		const source = `function paint_side(length):
    let done = 0
    while done < length:
        done = done + 1

let sides = 4
let name = "côté 🤖"
let tint = red
let ready = true
paint_side(3)
`;
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start(source);
		// Up to the line of the `while`, reached for the first time: `let done = 0` has just run.
		runToLine(run, 3);
		// The main program has no `function`: the key is left out rather than undefined.
		expect(run.calls()).toStrictEqual([
			{
				line: 10,
				variables: [
					{ name: 'sides', value: { type: 'number', text: '4' }, changed: false },
					{ name: 'name', value: { type: 'text', text: 'côté 🤖' }, changed: false },
					{ name: 'tint', value: { type: 'color', text: 'red' }, changed: false },
					{ name: 'ready', value: { type: 'boolean', text: 'true' }, changed: false }
				]
			},
			{
				function: 'paint_side',
				line: 3,
				variables: [
					{ name: 'length', value: { type: 'number', text: '3' }, changed: false },
					{ name: 'done', value: { type: 'number', text: '0' }, changed: true }
				]
			}
		]);
	});

	it('give a whole number beyond what JavaScript holds exactly with every digit', () => {
		const source = 'let most = 9223372036854775807\nrepeat 0 - most:\n    forward()\n';
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start(source);
		finish(run);
		expect(run.calls()[0]?.variables).toStrictEqual([
			{ name: 'most', value: { type: 'number', text: '9223372036854775807' }, changed: false }
		]);
		const outcome = run.outcome();
		expect(outcome?.type === 'failed' ? outcome.error.kind : undefined).toStrictEqual({
			code: 'negative-repeat-count',
			count: '-9223372036854775807'
		});
	});

	it('tell a line that starts from a line resumed after a call', () => {
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start('function double(n):\n    return n * 2\n\nprint(double(3))\n');
		const lines: [number, boolean][] = [];
		for (let line = run.line; line !== undefined && lines.length < MAX_STEPS; line = run.line) {
			lines.push([line, run.afterCall]);
			run.step();
		}
		// A breakpoint on the line 4 pauses once, when the line starts.
		expect(lines).toStrictEqual([
			[4, false],
			[2, false],
			[4, true]
		]);
		expect(run.printed()).toBe('6');
	});

	it('stop at 200 calls, all of them still given with the error', () => {
		const source = 'function down(depth):\n    down(depth + 1)\n\ndown(1)\n';
		using sandbox = new Sandbox(SMALL_SANDBOX);
		using run = sandbox.start(source);
		finish(run);
		const outcome = run.outcome();
		const error = outcome?.type === 'failed' ? outcome.error : undefined;
		expect(error?.kind).toStrictEqual({ code: 'too-many-calls', function: 'down', limit: 200 });
		expect(source.slice(error?.span.from, error?.span.to)).toBe('down(depth + 1)');
		// The main program, then the 200 calls, the last one refused its own call.
		const calls = run.calls();
		expect(calls).toHaveLength(201);
		expect(calls.at(-1)).toStrictEqual({
			function: 'down',
			line: 2,
			variables: [{ name: 'depth', value: { type: 'number', text: '200' }, changed: false }]
		});
	});
});

// The limits of the parser (`MAX_DEPTH` and `MAX_BLOCK_DEPTH` in crates/core/src/parser.rs): the
// tree of a program is walked by recursive functions, on the stack of the WebAssembly module,
// which is far smaller than the one of the tests of the core. Each program below is the deepest
// of its kind, checked then run to its end through the real module.
describe('a program at the maximum depth of the tree', () => {
	const MAX_DEPTH = 200;
	const MAX_BLOCK_DEPTH = 50;

	/** `depth` blocks, one inside the other, around `line`. */
	function nestedBlocks(depth: number, line: string): string {
		let source = '';
		for (let level = 0; level < depth; level += 1) {
			source += `${'    '.repeat(level)}${level % 2 === 0 ? 'if true:' : 'repeat 1:'}\n`;
		}
		return `${source}${'    '.repeat(depth)}${line}\n`;
	}

	/** A value inside `depth` pairs of parentheses, printed. */
	function nestedValue(depth: number): string {
		return `print(${'('.repeat(depth)}1${')'.repeat(depth)})`;
	}

	/** What the deepest program prints, `deeper` being refused for one level more. */
	function printedAtTheLimit(source: string, deeper: string): (string | undefined)[] {
		expect(check(deeper).map((error) => error.kind.code)).toStrictEqual(['too-deep']);
		expect(check(source)).toStrictEqual([]);
		return printedBy(source);
	}

	it('is checked and run for the deepest expressions', () => {
		// In `print(…)`, the call and the value each take one level of the tree.
		const depth = MAX_DEPTH - 2;
		expect(printedAtTheLimit(nestedValue(depth), nestedValue(depth + 1))).toStrictEqual(['1']);
		const negated = (count: number): string => `print(${'not '.repeat(count)}true)`;
		expect(printedAtTheLimit(negated(depth), negated(depth + 1))).toStrictEqual(['true']);
		// A chain of operators is as deep as it is long.
		const sum = (terms: number): string => `print(${Array(terms).fill('1').join(' + ')})`;
		expect(printedAtTheLimit(sum(depth + 1), sum(depth + 2))).toStrictEqual([String(depth + 1)]);
	});

	it('is checked and run for the deepest blocks, around the deepest expression they take', () => {
		const deep = (depth: number): string => nestedBlocks(depth, 'print("deep")');
		expect(printedAtTheLimit(deep(MAX_BLOCK_DEPTH), deep(MAX_BLOCK_DEPTH + 1))).toStrictEqual([
			'deep'
		]);
		// The deepest expression the parser takes inside the deepest blocks.
		const depth = MAX_DEPTH - MAX_BLOCK_DEPTH - 2;
		const nested = (levels: number): string => nestedBlocks(MAX_BLOCK_DEPTH, nestedValue(levels));
		expect(printedAtTheLimit(nested(depth), nested(depth + 1))).toStrictEqual(['1']);
		// The worst case for the stack: a call costs more of it than a pair of parentheses, in the
		// parser as in the checker, so the same depth made of calls of a function.
		const same = 'function same(value):\n    return value\n\n';
		const calls = (levels: number): string =>
			`print(${'same('.repeat(levels)}1${')'.repeat(levels)})`;
		const worst = (levels: number): string => same + nestedBlocks(MAX_BLOCK_DEPTH, calls(levels));
		expect(printedAtTheLimit(worst(depth), worst(depth + 1))).toStrictEqual(['1']);
	});
});
