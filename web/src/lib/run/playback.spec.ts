// A program played on the map through the module the page loads, its frames given by the tests.

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Level, type Run, Sandbox, type World } from '#lib/core/core.ts';
import { corridor, levelOf, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import { NORMAL_SPEED } from './pace.ts';
import {
	type Frames,
	Playback,
	type PlaybackOptions,
	type PlaybackSource
} from './playback.svelte.ts';
import { pageOf } from './test-support.ts';

loadTestCore();

/** A corridor of four cells, the robot on the first one, facing east. */
const sandbox = new Sandbox(sandboxOf(corridor('....')));
/** The same corridor, an item on its second cell. */
const withItem = new Sandbox(sandboxOf(corridor('....', 'items = [[1, 0]]\n')));
/** The same corridor in a level, whose goal is to stand on its second cell. */
const level = new Level(levelOf(corridor('....', '\n[maps.goals]\nrobot_at = [1, 0]\n')));
afterAll(() => {
	sandbox.free();
	withItem.free();
	level.free();
});

/** The map of the level as it starts. */
function levelWorld(): World {
	const [map] = level.maps();
	if (!map) throw new Error('the level of the tests has a map');
	return map.world;
}

/**
 * The speed, in steps per second, which a test changes while its program runs, as the setting
 * does. The normal speed as each test starts: 2 steps per second, 300 ms a move.
 */
let rate: number;
beforeEach(() => {
	rate = NORMAL_SPEED;
});

/** No frame comes by itself: a test gives each one, by calling `tick`. */
const noFrames: Frames = () => () => {};

/** Plays what `source` gives, at the speed of the test, its frames given by the test. */
function playOn(source: PlaybackSource, options?: PlaybackOptions): Playback {
	return new Playback(source, { rate: () => rate, frames: noFrames, ...options });
}

/** Plays `program` in the corridor. */
function play(program: string, options?: PlaybackOptions): Playback {
	return playOn({ world: sandbox.world(), start: () => sandbox.start(program) }, options);
}

/** Plays `program` on the map of the level. */
function playLevel(program: string, options?: PlaybackOptions): Playback {
	return playOn({ world: levelWorld(), start: () => level.start(0, program) }, options);
}

/** A clock for **Instant** that moves on a millisecond each time it is read. */
function ticking(): () => number {
	let time = 0;
	return () => (time += 1);
}

describe('a program played on the map', () => {
	it('animates an action, the line staying lit until it has ended', () => {
		using playback = play('forward()\nturn_right()\n');
		playback.play();
		expect(playback.tick(0)).toBe(true);
		expect(playback.motion?.action).toBe('moved');
		expect(playback.world.robot.position).toEqual({ x: 0, y: 0 });
		expect(playback.line).toBe(1);
		playback.tick(150);
		expect(playback.progress).toBe(0.5);
		expect(playback.line).toBe(1);
		playback.tick(300);
		expect(playback.motion).toBeUndefined();
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.line).toBe(2);
		// The robot rests until the next step, at the first frame 500 ms after the first one.
		playback.tick(450);
		expect(playback.motion).toBeUndefined();
		playback.tick(510);
		expect(playback.motion?.action).toBe('turned-right');
		// The program still runs while its last action plays.
		expect(playback.status).toBe('running');
		playback.tick(810);
		expect(playback.world.robot.direction).toBe('south');
		expect({ line: playback.line, status: playback.status, steps: playback.steps }).toEqual({
			line: undefined,
			status: 'ended',
			steps: 2
		});
		expect(playback.tick(826)).toBe(false);
	});

	it('shows the map at rest before any Run, no line lit, whatever the program', () => {
		// A program with an error can't start: the map shows all the same, and can be put back.
		using playback = play('forward(\n');
		expect({
			status: playback.status,
			line: playback.line,
			steps: playback.steps,
			position: playback.world.robot.position
		}).toEqual({ status: 'ready', line: undefined, steps: 0, position: { x: 0, y: 0 } });
		playback.reset();
		expect(playback.status).toBe('ready');
	});

	it('says where the program stands', () => {
		using playback = play('forward()\nforward()\n');
		expect(playback.status).toBe('ready');
		playback.play();
		playback.tick(0);
		expect(playback.status).toBe('running');
		playback.pause();
		expect(playback.status).toBe('paused');
		playback.reset();
		expect(playback.status).toBe('ready');
	});

	it('only starts the program on a Step at rest, paused before its first step', () => {
		using playback = play('forward()\nforward()\n');
		playback.step();
		expect({
			status: playback.status,
			line: playback.line,
			steps: playback.steps,
			motion: playback.motion
		}).toEqual({ status: 'paused', line: 1, steps: 0, motion: undefined });
		expect(playback.tick(0)).toBe(false);
		// The next one runs the line that was lit.
		playback.step();
		expect({ action: playback.motion?.action, steps: playback.steps }).toEqual({
			action: 'moved',
			steps: 1
		});
	});

	it('runs the program as it is at each start', () => {
		let program = 'forward()\n';
		using playback = playOn({ world: sandbox.world(), start: () => sandbox.start(program) });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		program = 'turn_right()\n';
		playback.play();
		playback.tick(1000);
		playback.tick(1300);
		expect(playback.world.robot).toMatchObject({ position: { x: 0, y: 0 }, direction: 'south' });
	});

	it('stays as it was when the program can’t start', () => {
		let program = 'forward()\n';
		using playback = playOn({ world: sandbox.world(), start: () => sandbox.start(program) });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		program = 'forward(\n';
		expect(() => {
			playback.play();
		}).toThrow();
		expect({ status: playback.status, position: playback.world.robot.position }).toEqual({
			status: 'ended',
			position: { x: 1, y: 0 }
		});
		playback.reset();
		expect({ status: playback.status, position: playback.world.robot.position }).toEqual({
			status: 'ready',
			position: { x: 0, y: 0 }
		});
	});

	it('tells each line printed, in order, at Instant too', () => {
		const printed: string[] = [];
		const onPrinted = (line: string) => printed.push(line);
		using animated = play('print(1)\nforward()\nprint()\n', { onPrinted });
		animated.play();
		animated.tick(0);
		expect(printed).toEqual(['1']);
		animated.tick(500);
		animated.tick(1000);
		expect(printed).toEqual(['1', '']);
		rate = Infinity;
		using instant = play('repeat 3:\n    print("again")\n', { onPrinted, now: ticking() });
		instant.play();
		instant.tick(0);
		expect(printed).toEqual(['1', '', 'again', 'again', 'again']);
	});

	it('tells once per run how the program stopped, once its last action has ended', () => {
		const stopped: string[] = [];
		const onStopped = (outcome: { type: string }) => stopped.push(outcome.type);
		using playback = play('forward()\nforward()\nforward()\nforward()\n', { onStopped });
		playback.play();
		for (let time = 0; time <= 1500; time += 500) playback.tick(time);
		// The fourth move bumps: the bump plays first, and the program has stopped once it ends.
		expect({ status: playback.status, stopped }).toEqual({ status: 'running', stopped: [] });
		for (let time = 2500; playback.tick(time); time += 500);
		expect(stopped).toEqual(['failed']);
		// A new run tells its own end, a program without a step at once.
		playback.play();
		for (let time = 10_000; playback.tick(time); time += 500);
		expect(stopped).toEqual(['failed', 'failed']);
		playback.reset();
		using empty = play('# nothing yet\n', { onStopped });
		empty.play();
		empty.play();
		expect(stopped).toEqual(['failed', 'failed', 'ended', 'ended']);
		empty.step();
		expect(stopped).toEqual(['failed', 'failed', 'ended', 'ended', 'ended']);
	});

	it('moves the line on at once after a step without action', () => {
		using playback = play('let steps = 1\nstop_painting()\nforward()\n');
		playback.play();
		playback.tick(0);
		expect({ line: playback.line, motion: playback.motion }).toEqual({
			line: 2,
			motion: undefined
		});
		playback.tick(510);
		expect({ line: playback.line, motion: playback.motion }).toEqual({
			line: 3,
			motion: undefined
		});
	});

	it('lets the action under way end after a pause, and runs nothing more', () => {
		using playback = play('forward()\nforward()\n');
		playback.play();
		playback.tick(0);
		playback.pause();
		expect(playback.tick(100)).toBe(true);
		expect(playback.tick(300)).toBe(false);
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.tick(1000)).toBe(false);
		expect(playback.steps).toBe(1);
	});

	it('plays the action of Step as at the slowest speed, even at Instant', () => {
		using playback = play('forward()\nforward()\n');
		rate = Infinity;
		playback.step();
		playback.step();
		expect(playback.motion?.action).toBe('moved');
		// The action starts at the frame that draws it first.
		playback.tick(1000);
		playback.tick(1150);
		expect(playback.progress).toBe(0.5);
		expect(playback.tick(1300)).toBe(false);
		expect({ line: playback.line, steps: playback.steps }).toEqual({ line: 2, steps: 1 });
	});

	it('resumes after a Step once its action has ended, a whole step before the next', () => {
		using playback = play('forward()\nforward()\nforward()\n');
		rate = 5;
		playback.step();
		playback.step();
		playback.tick(0);
		playback.play();
		// The step due at once waits for the end of the action of Step, 300 ms long.
		playback.tick(100);
		expect({ progress: playback.progress, steps: playback.steps }).toEqual({
			progress: 100 / 300,
			steps: 1
		});
		playback.tick(300);
		expect(playback.steps).toBe(2);
		// The next one comes a whole step later, 200 ms at 5 steps per second.
		playback.tick(450);
		expect(playback.steps).toBe(2);
		playback.tick(510);
		expect(playback.steps).toBe(3);
	});

	it('runs the next step at once on Resume after a pause', () => {
		using playback = play('let a = 1\nlet b = 2\nlet c = 3\n');
		rate = 1;
		playback.play();
		playback.tick(0);
		playback.pause();
		playback.tick(100);
		playback.play();
		playback.tick(200);
		expect(playback.steps).toBe(2);
	});

	it('waits for the action under way when the speed is made faster', () => {
		using playback = play('forward()\nforward()\n');
		rate = 1;
		playback.play();
		playback.tick(0);
		rate = 20;
		playback.tick(100);
		expect({ motion: playback.motion?.action, steps: playback.steps }).toEqual({
			motion: 'moved',
			steps: 1
		});
		playback.tick(300);
		expect(playback.steps).toBe(2);
	});

	it('puts the map back and waits on the first step on a Step once ended', () => {
		using playback = play('forward()\n');
		playback.play();
		playback.tick(0);
		playback.tick(300);
		expect(playback.status).toBe('ended');
		playback.step();
		expect({ status: playback.status, line: playback.line, motion: playback.motion }).toEqual({
			status: 'paused',
			line: 1,
			motion: undefined
		});
		expect(playback.world.robot.position).toEqual({ x: 0, y: 0 });
	});

	it('ends the action under way at once on another Step', () => {
		using playback = play('forward()\nforward()\n');
		playback.step();
		playback.step();
		playback.tick(0);
		playback.step();
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.motion?.after.robot.position).toEqual({ x: 2, y: 0 });
	});

	it('lets an action longer than a step end before the next step', () => {
		using playback = play('forward()\nforward()\n', { timeAt: () => 800 });
		playback.play();
		playback.tick(0);
		playback.tick(510);
		expect(playback.steps).toBe(1);
		playback.tick(800);
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.motion?.after.robot.position).toEqual({ x: 2, y: 0 });
	});

	it('runs the steps at Instant without animation', () => {
		using playback = play('repeat 3:\n    forward()\n', { now: ticking() });
		rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
		expect(playback.motion).toBeUndefined();
		expect(playback.world.robot.position).toEqual({ x: 3, y: 0 });
		expect({ status: playback.status, steps: playback.steps }).toEqual({
			status: 'ended',
			steps: 7
		});
	});

	it('keeps a program that never ends running at Instant, a frame at a time', () => {
		using playback = play('while true:\n    turn_left()\n', { now: ticking() });
		rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(true);
		const steps = playback.steps;
		expect(steps).toBeGreaterThan(0);
		expect(playback.tick(16)).toBe(true);
		expect(playback.steps).toBeGreaterThan(steps);
		expect({ status: playback.status, motion: playback.motion }).toEqual({
			status: 'running',
			motion: undefined
		});
	});

	it('shows a loop without end running at Instant: the robot is seen turning', () => {
		// A turn of the loop takes two steps, and the robot faces the same way every eight: frames
		// that each ran a number of steps that eight divides would show it still. With `ticking()`
		// every frame runs the same number of batches, 7 of 997 steps: this only checks that
		// 7 × 997 isn't a multiple of 8, not the clock of a real browser, which varies from a
		// frame to the next (see `BATCH` in pace.ts).
		using playback = play('while true:\n    turn_left()\n', { now: ticking() });
		rate = Infinity;
		playback.play();
		const seen = new Set<string>();
		for (let frame = 0; frame < 4; frame += 1) {
			playback.tick(frame * 16);
			seen.add(playback.world.robot.direction);
		}
		expect(seen.size).toBeGreaterThan(1);
	});

	it('puts the map back to its start on Reset, and on Run once ended', () => {
		using playback = play('forward()\n');
		const start = playback.world;
		playback.play();
		playback.tick(0);
		playback.reset();
		expect(playback.world).toEqual(start);
		expect({ line: playback.line, steps: playback.steps, motion: playback.motion }).toEqual({
			line: undefined,
			steps: 0,
			motion: undefined
		});
		playback.play();
		playback.tick(0);
		playback.tick(300);
		expect(playback.stopped).toBe(true);
		playback.play();
		expect({ position: playback.world.robot.position, line: playback.line }).toEqual({
			position: { x: 0, y: 0 },
			line: 1
		});
	});

	it('animates an item picked up and dropped, longer than a move', () => {
		using playback = playOn({
			world: withItem.world(),
			start: () => withItem.start('forward()\npick_up()\ndrop()\n')
		});
		playback.play();
		playback.tick(0);
		playback.tick(300);
		playback.tick(500);
		expect(playback.motion?.action).toBe('picked-up');
		expect(playback.world.robot.carrying).toBe(false);
		playback.tick(850);
		expect(playback.motion?.action).toBe('picked-up');
		playback.tick(900);
		expect({ carrying: playback.world.robot.carrying, line: playback.line }).toEqual({
			carrying: true,
			line: 3
		});
	});

	it('shows a bump whole, even at 20 steps per second, then tells the error', () => {
		using playback = play('repeat 4:\n    forward()\n');
		rate = 20;
		playback.play();
		let time = 0;
		while (playback.motion?.action !== 'bump' && time < 1000) playback.tick((time += 50));
		expect(playback.world.robot.position).toEqual({ x: 3, y: 0 });
		// The line of the error stays lit, the program running, while the robot shows it.
		expect({ line: playback.line, status: playback.status, outcome: playback.outcome }).toEqual({
			line: 2,
			status: 'running',
			outcome: undefined
		});
		playback.tick(time + 400);
		expect(playback.motion?.action).toBe('bump');
		playback.tick(time + 450);
		expect(playback.motion).toBeUndefined();
		expect({ status: playback.status, outcome: playback.outcome }).toMatchObject({
			status: 'failed',
			outcome: { type: 'failed', error: { kind: { code: 'bump' }, span: { line: 2 } } }
		});
	});

	it('shows a pick_up() that fails, and nothing on the map for another error', () => {
		using failed = play('pick_up()\n');
		failed.play();
		failed.tick(0);
		expect(failed.motion?.action).toBe('no-item-here');
		using other = play('print(1 / 0)\n');
		other.play();
		other.tick(0);
		expect({ motion: other.motion, type: other.outcome?.type }).toEqual({
			motion: undefined,
			type: 'failed'
		});
	});

	it('ends an error of the robot at once on a second Step, without playing it again', () => {
		using playback = play('pick_up()\n');
		playback.step();
		playback.step();
		expect(playback.motion?.action).toBe('no-item-here');
		playback.step();
		expect({ motion: playback.motion, status: playback.status }).toEqual({
			motion: undefined,
			status: 'failed'
		});
		expect(playback.outcome?.type).toBe('failed');
	});

	it('ends an error of the robot at once when the speed becomes Instant', () => {
		using playback = play('pick_up()\n');
		playback.play();
		playback.tick(0);
		expect(playback.motion?.action).toBe('no-item-here');
		rate = Infinity;
		expect(playback.tick(16)).toBe(false);
		expect({ motion: playback.motion, status: playback.status }).toEqual({
			motion: undefined,
			status: 'failed'
		});
	});

	it('shows no bump at Instant, the error told at once', () => {
		using playback = play('repeat 4:\n    forward()\n', { now: ticking() });
		rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
		expect(playback.motion).toBeUndefined();
		expect(playback.outcome?.type).toBe('failed');
	});

	it('tells how a program that ended well ended, and nothing once put back', () => {
		using playback = play('forward()\n');
		playback.play();
		playback.tick(0);
		expect(playback.outcome).toBeUndefined();
		playback.tick(300);
		expect(playback.outcome).toEqual({ type: 'ended' });
		playback.reset();
		expect(playback.outcome).toBeUndefined();
	});

	it('records whether the learner asked for less motion as each step starts', () => {
		let less = false;
		using playback = play('forward()\nforward()\n', { lessMotion: () => less });
		playback.play();
		playback.tick(0);
		expect(playback.motion?.lessMotion).toBe(false);
		less = true;
		playback.tick(510);
		expect(playback.motion?.lessMotion).toBe(true);
	});

	it('shows a pick_up() that fails by its error alone with less motion', () => {
		using playback = play('pick_up()\n', { lessMotion: () => true });
		playback.play();
		expect(playback.tick(0)).toBe(false);
		expect({ motion: playback.motion, type: playback.outcome?.type }).toEqual({
			motion: undefined,
			type: 'failed'
		});
	});
});

describe('the breakpoints', () => {
	/** The lines with a breakpoint, which a test changes while its program runs. */
	const at = (...lines: number[]) => {
		const set = new Set(lines);
		return { set, breakpoints: () => set };
	};

	it('pause the program before their line, once the action under way has ended', () => {
		const { breakpoints } = at(3);
		using playback = play('forward()\nforward()\nforward()\n', { breakpoints });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		playback.tick(500);
		// The second move is under way: the program still runs it, its line lit.
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			action: playback.motion?.action
		}).toEqual({ status: 'running', atBreakpoint: false, line: 2, action: 'moved' });
		// It ends, the line of the breakpoint is lit, and the program pauses before it.
		expect(playback.tick(800)).toBe(false);
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps,
			position: playback.world.robot.position
		}).toEqual({
			status: 'paused',
			atBreakpoint: true,
			line: 3,
			steps: 2,
			position: { x: 2, y: 0 }
		});
		playback.tick(2000);
		expect(playback.steps).toBe(2);
	});

	it('let Resume run the line paused on, then pause again only on a line that starts', () => {
		const { breakpoints } = at(3);
		using playback = play('forward()\nforward()\nforward()\n', { breakpoints });
		rate = Infinity;
		playback.play();
		playback.tick(0);
		expect({ line: playback.line, steps: playback.steps }).toEqual({ line: 3, steps: 2 });
		playback.play();
		expect(playback.atBreakpoint).toBe(false);
		playback.tick(16);
		expect({ status: playback.status, steps: playback.steps }).toEqual({
			status: 'ended',
			steps: 3
		});
	});

	it('pause the program before its first line on Run', () => {
		const { breakpoints } = at(1);
		using playback = play('forward()\n', { breakpoints });
		playback.play();
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps
		}).toEqual({ status: 'paused', atBreakpoint: true, line: 1, steps: 0 });
		expect(playback.tick(0)).toBe(false);
		expect(playback.steps).toBe(0);
	});

	it('pause at each turn of a loop, whose line runs again', () => {
		const { breakpoints } = at(2);
		using playback = play('repeat 3:\n    turn_left()\n', { breakpoints, now: ticking() });
		rate = Infinity;
		const pauses: number[] = [];
		for (let frame = 0; frame < 10 && playback.status !== 'ended'; frame += 1) {
			playback.play();
			playback.tick(frame * 16);
			if (playback.atBreakpoint) pauses.push(playback.steps);
		}
		// The line of the loop runs before each turn, and the line of its block after it.
		expect(pauses).toEqual([1, 3, 5]);
		expect(playback.status).toBe('ended');
	});

	it('don’t pause again when the line of a call is lit once the call has ended', () => {
		const { breakpoints } = at(3);
		const program = 'function go():\n    forward()\ngo()\nprint("after")\n';
		using playback = play(program, { breakpoints, now: ticking() });
		rate = Infinity;
		playback.play();
		expect({ line: playback.line, atBreakpoint: playback.atBreakpoint }).toEqual({
			line: 3,
			atBreakpoint: true
		});
		playback.play();
		playback.tick(0);
		expect({ status: playback.status, atBreakpoint: playback.atBreakpoint }).toEqual({
			status: 'ended',
			atBreakpoint: false
		});
	});

	it('pause each call of a recursion that reaches the line of the call, never one that comes back', () => {
		const { breakpoints } = at(3);
		const program = 'function down(count):\n    if count > 0:\n        down(count - 1)\ndown(2)\n';
		using playback = play(program, { breakpoints, now: ticking() });
		rate = Infinity;
		const pauses: number[] = [];
		for (let frame = 0; frame < 10 && playback.status !== 'ended'; frame += 1) {
			playback.play();
			playback.tick(frame * 16);
			if (playback.atBreakpoint) pauses.push(playback.steps);
		}
		// down(2) and down(1) reach the call after their `if`; down(0) doesn't, and each return
		// lights it again.
		expect(pauses).toEqual([2, 4]);
		expect(playback.status).toBe('ended');
	});

	it('stop a frame of Instant in a loop that never ends', () => {
		const { breakpoints } = at(2);
		using playback = play('while true:\n    turn_left()\n', { breakpoints, now: ticking() });
		rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
		expect({ status: playback.status, line: playback.line, steps: playback.steps }).toEqual({
			status: 'paused',
			line: 2,
			steps: 1
		});
	});

	it('pause before the line lit when one is set there while the program runs', () => {
		const { set, breakpoints } = at();
		using playback = play('print(1)\nprint(2)\nprint(3)\n', { breakpoints });
		playback.play();
		playback.tick(0);
		expect(playback.line).toBe(2);
		set.add(2);
		playback.tick(500);
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps
		}).toEqual({ status: 'paused', atBreakpoint: true, line: 2, steps: 1 });
	});

	it('pause on the next line after a Step, when Resume comes while its action plays', () => {
		const { breakpoints } = at(2, 3);
		using playback = play('forward()\nforward()\nforward()\n', { breakpoints });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		playback.tick(500);
		expect({ line: playback.line, atBreakpoint: playback.atBreakpoint }).toEqual({
			line: 2,
			atBreakpoint: true
		});
		playback.step();
		playback.tick(600);
		playback.play();
		playback.tick(800);
		playback.tick(1700);
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps
		}).toEqual({ status: 'paused', atBreakpoint: true, line: 3, steps: 2 });
	});

	it('pause on the next line when Resume follows a Pause during an action', () => {
		const { breakpoints } = at(3);
		using playback = play('forward()\nforward()\nforward()\n', { breakpoints });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		playback.tick(500);
		playback.pause();
		playback.play();
		playback.tick(800);
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps
		}).toEqual({ status: 'paused', atBreakpoint: true, line: 3, steps: 2 });
	});

	it('pause on the next line when Instant is chosen during the action before it', () => {
		const { breakpoints } = at(3);
		using playback = play('forward()\nforward()\nforward()\n', { breakpoints, now: ticking() });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		playback.tick(500);
		rate = Infinity;
		playback.tick(516);
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps
		}).toEqual({ status: 'paused', atBreakpoint: true, line: 3, steps: 2 });
	});

	it('pause before a line set while the action before it plays, and not one removed', () => {
		const { set, breakpoints } = at(3);
		using playback = play('forward()\nforward()\nforward()\nforward()\n', { breakpoints });
		playback.play();
		playback.tick(0);
		playback.tick(300);
		playback.tick(500);
		// The second move is under way: the breakpoint of its next line is taken away, and one is
		// set on the line after.
		set.delete(3);
		set.add(4);
		playback.tick(800);
		expect(playback.status).toBe('running');
		playback.tick(1000);
		playback.tick(1300);
		expect({
			status: playback.status,
			atBreakpoint: playback.atBreakpoint,
			line: playback.line,
			steps: playback.steps
		}).toEqual({ status: 'paused', atBreakpoint: true, line: 4, steps: 3 });
	});

	it('leave a Step alone, which pauses anyway, and say no breakpoint once it has run', () => {
		const { breakpoints } = at(2, 3);
		using playback = play('forward()\nforward()\nforward()\n', { breakpoints, now: ticking() });
		rate = Infinity;
		playback.play();
		playback.tick(0);
		expect({ line: playback.line, atBreakpoint: playback.atBreakpoint }).toEqual({
			line: 2,
			atBreakpoint: true
		});
		playback.step();
		expect({
			status: playback.status,
			line: playback.line,
			atBreakpoint: playback.atBreakpoint
		}).toEqual({ status: 'paused', line: 2, atBreakpoint: false });
		// Its move plays as at the slowest speed, then the line of the breakpoint is lit.
		playback.tick(16);
		playback.tick(5000);
		expect({
			status: playback.status,
			line: playback.line,
			steps: playback.steps,
			atBreakpoint: playback.atBreakpoint
		}).toEqual({ status: 'paused', line: 3, steps: 2, atBreakpoint: false });
	});

	it('say no breakpoint once the map is put back', () => {
		const { breakpoints } = at(1);
		using playback = play('forward()\n', { breakpoints });
		playback.play();
		playback.reset();
		expect({ status: playback.status, atBreakpoint: playback.atBreakpoint }).toEqual({
			status: 'ready',
			atBreakpoint: false
		});
	});
});

describe('the end of a run', () => {
	it('plays once the last action has ended, the program ended', () => {
		using playback = playLevel('forward()\n');
		playback.play();
		playback.tick(0);
		expect(playback.outcome).toBeUndefined();
		playback.tick(300);
		expect({
			action: playback.motion?.action,
			outcome: playback.outcome,
			status: playback.status
		}).toEqual({ action: 'passed', outcome: { type: 'passed' }, status: 'ended' });
		expect(playback.tick(750)).toBe(true);
		expect(playback.progress).toBe(0.5);
		expect(playback.tick(1200)).toBe(false);
		expect({ motion: playback.motion, outcome: playback.outcome }).toEqual({
			motion: undefined,
			outcome: { type: 'passed' }
		});
	});

	it('plays at once after a last step without action, for a goal not met too', () => {
		using playback = playLevel('stop_painting()\n');
		playback.play();
		playback.tick(0);
		expect({ action: playback.motion?.action, type: playback.outcome?.type }).toEqual({
			action: 'goals-not-met',
			type: 'goals-not-met'
		});
		playback.tick(450);
		expect(playback.progress).toBe(0.5);
	});

	it('keeps its whole time at 20 steps per second', () => {
		using playback = playLevel('forward()\n');
		rate = 20;
		playback.play();
		playback.tick(0);
		playback.tick(40);
		expect(playback.motion?.action).toBe('passed');
		playback.tick(490);
		expect(playback.progress).toBe(0.5);
	});

	it('shows at once at Instant, and as at the slowest speed after a Step', () => {
		using instant = playLevel('forward()\n', { now: ticking() });
		rate = Infinity;
		instant.play();
		expect(instant.tick(0)).toBe(false);
		expect({ motion: instant.motion, type: instant.outcome?.type }).toEqual({
			motion: undefined,
			type: 'passed'
		});
		using stepped = playLevel('forward()\n');
		rate = Infinity;
		stepped.step();
		stepped.step();
		stepped.tick(0);
		stepped.tick(300);
		expect(stepped.motion?.action).toBe('passed');
		stepped.tick(750);
		expect(stepped.progress).toBe(0.5);
	});

	it('plays after the last action that a pause let end', () => {
		using playback = playLevel('forward()\n');
		playback.play();
		playback.tick(0);
		playback.pause();
		playback.tick(300);
		expect({ action: playback.motion?.action, status: playback.status }).toEqual({
			action: 'passed',
			status: 'ended'
		});
	});

	it('takes no time with less motion, the map showing it at once', () => {
		using playback = playLevel('forward()\n', { lessMotion: () => true });
		playback.play();
		playback.tick(0);
		expect(playback.tick(300)).toBe(false);
		expect({ motion: playback.motion, type: playback.outcome?.type }).toEqual({
			motion: undefined,
			type: 'passed'
		});
	});

	it('stops when the map is put back, on Run, Step or Reset', () => {
		for (const command of ['play', 'step', 'reset'] as const) {
			using playback = playLevel('forward()\n');
			playback.play();
			playback.tick(0);
			playback.tick(300);
			playback[command]();
			expect({ motion: playback.motion, outcome: playback.outcome, line: playback.line }).toEqual({
				motion: undefined,
				outcome: undefined,
				// Run and Step start the program again; Reset leaves it at rest.
				line: command === 'reset' ? undefined : 1
			});
		}
	});

	it('plays after the last action that a second Step ended at once', () => {
		using playback = playLevel('forward()\n');
		playback.step();
		playback.step();
		playback.tick(0);
		playback.step();
		expect({ action: playback.motion?.action, position: playback.world.robot.position }).toEqual({
			action: 'passed',
			position: { x: 1, y: 0 }
		});
	});

	it('shows at once when the speed becomes Instant during the last action', () => {
		using playback = playLevel('forward()\n');
		playback.play();
		playback.tick(0);
		rate = Infinity;
		expect(playback.tick(16)).toBe(false);
		expect({ motion: playback.motion, type: playback.outcome?.type }).toEqual({
			motion: undefined,
			type: 'passed'
		});
	});

	it('plays on when the speed becomes Instant during it, the program having ended', () => {
		using playback = playLevel('forward()\n');
		playback.play();
		playback.tick(0);
		playback.tick(300);
		rate = Infinity;
		expect(playback.tick(750)).toBe(true);
		expect(playback.progress).toBe(0.5);
	});

	it('plays nothing after an error of the robot on a map of a level', () => {
		using playback = playLevel('repeat 4:\n    forward()\n', { now: ticking() });
		rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
		rate = NORMAL_SPEED;
		using animated = playLevel('pick_up()\n');
		animated.play();
		animated.tick(0);
		expect(animated.motion?.action).toBe('no-item-here');
		expect(animated.tick(650)).toBe(false);
		expect({ motion: animated.motion, type: animated.outcome?.type }).toEqual({
			motion: undefined,
			type: 'failed'
		});
	});

	it('waits for Run for a program without a step, then plays at once', () => {
		using playback = playLevel('# Nothing to run\n');
		expect({
			status: playback.status,
			outcome: playback.outcome,
			motion: playback.motion
		}).toEqual({ status: 'ready', outcome: undefined, motion: undefined });
		playback.play();
		expect({
			action: playback.motion?.action,
			type: playback.outcome?.type,
			status: playback.status
		}).toEqual({ action: 'goals-not-met', type: 'goals-not-met', status: 'ended' });
		expect(playback.tick(0)).toBe(true);
		expect(playback.tick(900)).toBe(false);
		// Reset puts the map back, and the program waits for Run again, its end not played.
		playback.reset();
		expect({
			status: playback.status,
			outcome: playback.outcome,
			motion: playback.motion
		}).toEqual({ status: 'ready', outcome: undefined, motion: undefined });
		playback.step();
		expect(playback.motion?.action).toBe('goals-not-met');
	});

	it('shows the end of a program without a step at once at Instant', () => {
		using playback = playLevel('# Nothing to run\n');
		rate = Infinity;
		playback.play();
		expect({
			motion: playback.motion,
			type: playback.outcome?.type,
			status: playback.status
		}).toEqual({ motion: undefined, type: 'goals-not-met', status: 'ended' });
		expect(playback.tick(0)).toBe(false);
	});

	it('plays the end of a program without a step again on another Run', () => {
		using playback = playLevel('# Nothing to run\n');
		playback.play();
		playback.tick(0);
		playback.tick(900);
		expect(playback.motion).toBeUndefined();
		playback.play();
		expect({ action: playback.motion?.action, status: playback.status }).toEqual({
			action: 'goals-not-met',
			status: 'ended'
		});
	});

	it('plays nothing in the sandbox, which has no goal', () => {
		using playback = play('forward()\n');
		playback.play();
		playback.tick(0);
		expect(playback.tick(300)).toBe(false);
		expect(playback.motion).toBeUndefined();
	});
});

describe('the actions told', () => {
	/** What `onAction` was told: each action, its time and its speed. */
	function told() {
		const actions: [string, number, number][] = [];
		return {
			actions,
			onAction: (action: string, time: number, speed: number) => actions.push([action, time, speed])
		};
	}

	it('tells each action that a step shows as it starts, with its time and its speed', () => {
		const { actions, onAction } = told();
		using playback = play('forward()\nprint(1)\nturn_left()\nstart_painting(red)\n', {
			onAction
		});
		playback.play();
		playback.tick(0);
		expect(actions).toEqual([['moved', 300, 2]]);
		for (let time = 500; playback.tick(time); time += 500);
		// A line printed shows nothing; the end of a run of the sandbox neither.
		expect(actions).toEqual([
			['moved', 300, 2],
			['turned-left', 300, 2],
			['started-painting', 300, 2]
		]);
	});

	it('tells the action of a Step at the slowest speed, whatever the speed chosen', () => {
		const { actions, onAction } = told();
		using playback = play('forward()\n', { onAction });
		rate = 20;
		playback.step();
		expect(actions).toEqual([]);
		playback.step();
		expect(actions).toEqual([['moved', 300, 1]]);
	});

	it('tells the error of the robot that stopped the program, then nothing more', () => {
		const { actions, onAction } = told();
		using playback = play('repeat 4:\n    forward()\n', { onAction });
		rate = 20;
		playback.play();
		for (let time = 0; playback.tick(time); time += 50);
		expect(actions.at(-1)).toEqual(['bump', 450, 20]);
		expect(actions.filter(([action]) => action !== 'moved')).toHaveLength(1);
	});

	it('tells nothing of an error that the map doesn’t show', () => {
		const { actions, onAction } = told();
		using playback = play('print(1 / 0)\n', { onAction });
		playback.play();
		playback.tick(0);
		expect({ actions, type: playback.outcome?.type }).toEqual({ actions: [], type: 'failed' });
	});

	it('tells the end of a run on a map of a level once the last action has ended', () => {
		const { actions, onAction } = told();
		using playback = playLevel('forward()\n', { onAction });
		playback.play();
		playback.tick(0);
		expect(actions).toEqual([['moved', 300, 2]]);
		playback.tick(300);
		expect(actions).toEqual([
			['moved', 300, 2],
			['passed', 900, 2]
		]);
	});

	it('tells the end of a program without a step on Run, a goal not met', () => {
		const { actions, onAction } = told();
		using playback = playLevel('# nothing yet\n', { onAction });
		playback.play();
		expect(actions).toEqual([['goals-not-met', 900, 2]]);
	});

	it('tells the end with no time with less motion, the map showing it at once', () => {
		const { actions, onAction } = told();
		using playback = playLevel('forward()\n', { onAction, lessMotion: () => true });
		playback.play();
		for (let time = 0; playback.tick(time); time += 500);
		expect(actions.at(-1)).toEqual(['passed', 0, 2]);
	});

	it('tells at Instant only the error of the robot and the end of a run, with no time', () => {
		const bumped = told();
		using bump = play('repeat 4:\n    forward()\n', { onAction: bumped.onAction, now: ticking() });
		rate = Infinity;
		bump.play();
		bump.tick(0);
		expect(bumped.actions).toEqual([['bump', 0, Infinity]]);
		const passed = told();
		using onLevel = playLevel('forward()\n', { onAction: passed.onAction, now: ticking() });
		onLevel.play();
		onLevel.tick(0);
		expect(passed.actions).toEqual([['passed', 0, Infinity]]);
	});
});

describe('the frames of the page', () => {
	it('asks for none at rest', () => {
		const page = pageOf();
		using playback = play('forward()\n', { frames: page.frames });
		expect({ status: playback.status, asked: page.asked() }).toEqual({
			status: 'ready',
			asked: false
		});
	});

	it('asks for one on Run, then for the next ones until the last action has ended', () => {
		const page = pageOf();
		using playback = play('forward()\n', { frames: page.frames });
		playback.play();
		expect(page.draw(0)).toBe(true);
		expect(playback.motion?.action).toBe('moved');
		expect(page.draw(150)).toBe(true);
		expect(page.draw(300)).toBe(true);
		expect({ status: playback.status, asked: page.asked() }).toEqual({
			status: 'ended',
			asked: false
		});
	});

	it('asks for the frames of the action of a Step, and for one frame at a time', () => {
		const page = pageOf();
		using playback = play('forward()\nforward()\n', { frames: page.frames });
		playback.step();
		playback.step();
		// A second request while one waits would throw.
		playback.play();
		playback.pause();
		expect(page.draw(0)).toBe(true);
		expect(page.draw(300)).toBe(true);
		expect({ steps: playback.steps, asked: page.asked() }).toEqual({ steps: 1, asked: false });
	});

	it('stops, and tells it, when a frame throws, which the core never makes one do', () => {
		const page = pageOf();
		const broken: unknown[] = [];
		let run: Run | undefined;
		const playback = playOn(
			{
				world: sandbox.world(),
				start: () => (run = sandbox.start('forward()\nforward()\n'))
			},
			{ frames: page.frames, onBroken: (error) => broken.push(error) }
		);
		playback.play();
		page.draw(0);
		// A run freed behind its back throws at its next step, as an error of the bridge would.
		run?.free();
		expect(() => page.draw(300)).toThrow();
		expect({
			running: playback.running,
			motion: playback.motion,
			asked: page.asked(),
			told: broken.length
		}).toEqual({ running: false, motion: undefined, asked: false, told: 1 });
	});

	it('stops the same way, and tells it, when a Step throws', () => {
		const page = pageOf();
		const broken: unknown[] = [];
		let run: Run | undefined;
		const playback = playOn(
			{
				world: sandbox.world(),
				start: () => (run = sandbox.start('forward()\nforward()\n'))
			},
			{ frames: page.frames, onBroken: (error) => broken.push(error) }
		);
		playback.step();
		run?.free();
		expect(() => {
			playback.step();
		}).toThrow();
		expect({ running: playback.running, asked: page.asked(), told: broken.length }).toEqual({
			running: false,
			asked: false,
			told: 1
		});
	});

	it('takes its frame back on Reset, and once freed', () => {
		const page = pageOf();
		const playback = play('forward()\nforward()\n', { frames: page.frames });
		playback.play();
		page.draw(0);
		playback.reset();
		expect(page.asked()).toBe(false);
		playback.play();
		expect(page.asked()).toBe(true);
		playback.free();
		expect(page.asked()).toBe(false);
	});
});
