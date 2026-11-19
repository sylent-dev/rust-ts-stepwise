// A program played on the map through the module the page loads, its frames given by the tests.

import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { initSync, Level, Sandbox } from '#lib/wasm/stepwise.js';
import { Playback, type PlaybackOptions } from './playback.svelte.ts';

initSync({ module: readFileSync(new URL('./wasm/stepwise_bg.wasm', import.meta.url)) });

/** A corridor of four cells, the robot on the first one, facing east. */
const CORRIDOR = `version = 1
starting_code = ''

[map]
terrain = '....'
robot = { at = [0, 0], facing = "east" }
`;

const sandbox = new Sandbox(CORRIDOR);
/** The same corridor, an item on its second cell. */
const withItem = new Sandbox(`${CORRIDOR}items = [[1, 0]]\n`);
/** The same corridor in a level, whose goal is to stand on its second cell. */
const level = new Level(`version = 1
starting_code = ''

[[maps]]
terrain = '....'
robot = { at = [0, 0], facing = "east" }

[maps.goals]
robot_at = [1, 0]
`);
afterAll(() => {
	sandbox.free();
	withItem.free();
	level.free();
});

/** Plays `program` in the corridor, at the normal speed: 2 steps per second, 300 ms a move. */
function play(program: string, options?: PlaybackOptions): Playback {
	return new Playback(() => sandbox.start(program), options);
}

/** Plays `program` on the map of the level, at the normal speed. */
function playLevel(program: string, options?: PlaybackOptions): Playback {
	return new Playback(() => level.start(0, program), options);
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

	it('says where the program stands', () => {
		using playback = play('forward()\nforward()\n');
		expect(playback.status).toBe('ready');
		playback.play();
		playback.tick(0);
		expect(playback.status).toBe('running');
		playback.pause();
		expect(playback.status).toBe('paused');
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
		playback.rate = Infinity;
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
		playback.rate = 5;
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
		playback.rate = 1;
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
		playback.rate = 1;
		playback.play();
		playback.tick(0);
		playback.rate = 20;
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
			status: 'ready',
			line: 1,
			motion: undefined
		});
		expect(playback.world.robot.position).toEqual({ x: 0, y: 0 });
	});

	it('ends the action under way at once on another Step', () => {
		using playback = play('forward()\nforward()\n');
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
		playback.rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
		expect(playback.motion).toBeUndefined();
		expect(playback.world.robot.position).toEqual({ x: 3, y: 0 });
		expect({ ended: playback.ended, steps: playback.steps }).toEqual({ ended: true, steps: 7 });
	});

	it('keeps a program that never ends running at Instant, a frame at a time', () => {
		using playback = play('while true:\n    turn_left()\n', { now: ticking() });
		playback.rate = Infinity;
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

	it('puts the map back to its start on Reset, and on Run once ended', () => {
		using playback = play('forward()\n');
		const start = playback.world;
		playback.play();
		playback.tick(0);
		playback.reset();
		expect(playback.world).toEqual(start);
		expect({ line: playback.line, steps: playback.steps, motion: playback.motion }).toEqual({
			line: 1,
			steps: 0,
			motion: undefined
		});
		playback.play();
		playback.tick(0);
		playback.tick(300);
		expect(playback.ended).toBe(true);
		playback.play();
		expect({ position: playback.world.robot.position, line: playback.line }).toEqual({
			position: { x: 0, y: 0 },
			line: 1
		});
	});

	it('animates an item picked up and dropped, longer than a move', () => {
		using playback = new Playback(() => withItem.start('forward()\npick_up()\ndrop()\n'));
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
		playback.rate = 20;
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
			status: 'ended',
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
		expect(playback.motion?.action).toBe('no-item-here');
		playback.step();
		expect({ motion: playback.motion, status: playback.status }).toEqual({
			motion: undefined,
			status: 'ended'
		});
		expect(playback.outcome?.type).toBe('failed');
	});

	it('ends an error of the robot at once when the speed becomes Instant', () => {
		using playback = play('pick_up()\n');
		playback.play();
		playback.tick(0);
		expect(playback.motion?.action).toBe('no-item-here');
		playback.rate = Infinity;
		expect(playback.tick(16)).toBe(false);
		expect({ motion: playback.motion, status: playback.status }).toEqual({
			motion: undefined,
			status: 'ended'
		});
	});

	it('shows no bump at Instant, the error told at once', () => {
		using playback = play('repeat 4:\n    forward()\n', { now: ticking() });
		playback.rate = Infinity;
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
		playback.rate = 20;
		playback.play();
		playback.tick(0);
		playback.tick(40);
		expect(playback.motion?.action).toBe('passed');
		playback.tick(490);
		expect(playback.progress).toBe(0.5);
	});

	it('shows at once at Instant, and as at the slowest speed after a Step', () => {
		using instant = playLevel('forward()\n', { now: ticking() });
		instant.rate = Infinity;
		instant.play();
		expect(instant.tick(0)).toBe(false);
		expect({ motion: instant.motion, type: instant.outcome?.type }).toEqual({
			motion: undefined,
			type: 'passed'
		});
		using stepped = playLevel('forward()\n');
		stepped.rate = Infinity;
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
				line: 1
			});
		}
	});

	it('plays after the last action that a second Step ended at once', () => {
		using playback = playLevel('forward()\n');
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
		playback.rate = Infinity;
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
		playback.rate = Infinity;
		expect(playback.tick(750)).toBe(true);
		expect(playback.progress).toBe(0.5);
	});

	it('plays nothing after an error of the robot on a map of a level', () => {
		using playback = playLevel('repeat 4:\n    forward()\n', { now: ticking() });
		playback.rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
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
		playback.rate = Infinity;
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
