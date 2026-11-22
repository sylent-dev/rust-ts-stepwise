// The program of a level screen, on the sandbox of a corridor, through the module the page
// loads. Its frames are those of the tests of `Playback`: here, only what starts and what stops.

import { afterAll, describe, expect, it } from 'vitest';
import { Sandbox } from '#lib/core/core.ts';
import { corridor, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import { sandboxPlayground } from './playground.ts';
import { Program } from './program.ts';

loadTestCore();

/** A corridor of four cells, the robot on the first one, facing east. */
const sandbox = new Sandbox(sandboxOf(corridor('....')));
afterAll(() => {
	sandbox.free();
});

/** The program of an editor that holds `code.text`, which a test changes as a learner would. */
function programOf(code: { text: string | undefined }): Program {
	return new Program(sandboxPlayground(sandbox), () => code.text, { frames: () => () => {} });
}

/** Gives the program its frames until nothing moves, a frame every 100 ms. */
function finish(program: Program): void {
	for (let time = 0; program.playback.tick(time); time += 100);
}

describe('the program of a screen', () => {
	it('runs the code of the editor, then pauses and resumes it, the command named for each', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		expect({ status: program.status, action: program.action }).toEqual({
			status: 'ready',
			action: 'run'
		});
		program.runOrPause();
		program.playback.tick(0);
		expect({
			status: program.status,
			action: program.action,
			steps: program.playback.steps
		}).toEqual({ status: 'running', action: 'pause', steps: 1 });
		program.runOrPause();
		expect({ status: program.status, action: program.action }).toEqual({
			status: 'paused',
			action: 'resume'
		});
		program.runOrPause();
		expect(program.status).toBe('running');
		finish(program);
		expect({
			status: program.status,
			action: program.action,
			steps: program.playback.steps
		}).toEqual({ status: 'ended', action: 'run', steps: 2 });
		program.free();
	});

	it('runs the code as it is when the program starts, from its start once it has stopped', () => {
		const code = { text: 'forward()\n' };
		const program = programOf(code);
		program.runOrPause();
		finish(program);
		expect(program.playback.world.robot.position).toEqual({ x: 1, y: 0 });
		code.text = 'turn_left()\n';
		program.runOrPause();
		finish(program);
		expect(program.playback.world.robot).toMatchObject({
			position: { x: 0, y: 0 },
			direction: 'north'
		});
		program.free();
	});

	it('starts nothing while the code has an error, and puts the map back', () => {
		const code = { text: 'forward()\n' };
		const program = programOf(code);
		program.runOrPause();
		finish(program);
		code.text = 'foward()\n';
		for (const command of ['runOrPause', 'step'] as const) {
			program[command]();
			expect(
				{ status: program.status, position: program.playback.world.robot.position },
				command
			).toEqual({ status: 'ready', position: { x: 0, y: 0 } });
		}
		program.free();
	});

	it('tells an error that stops the program from its end', () => {
		const program = programOf({ text: 'pick_up()\n' });
		program.runOrPause();
		finish(program);
		expect({ status: program.status, action: program.action }).toEqual({
			status: 'failed',
			action: 'run'
		});
		program.free();
	});

	it('only starts on a Step at rest, then runs a step at each one', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		program.step();
		expect({
			status: program.status,
			line: program.playback.line,
			steps: program.playback.steps
		}).toEqual({ status: 'paused', line: 1, steps: 0 });
		program.step();
		finish(program);
		expect({
			status: program.status,
			line: program.playback.line,
			steps: program.playback.steps
		}).toEqual({ status: 'paused', line: 2, steps: 1 });
		program.free();
	});

	it('can’t step while it runs', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		expect(program.canStep).toBe(true);
		program.runOrPause();
		program.playback.tick(0);
		expect(program.canStep).toBe(false);
		program.step();
		expect({ status: program.status, steps: program.playback.steps }).toEqual({
			status: 'running',
			steps: 1
		});
		program.free();
	});

	it('locks the code while it runs or is paused, and frees it once it has stopped', () => {
		const program = programOf({ text: 'forward()\n' });
		expect(program.locked).toBe(false);
		program.step();
		expect(program.locked).toBe(true);
		program.runOrPause();
		expect(program.locked).toBe(true);
		finish(program);
		expect({ status: program.status, locked: program.locked }).toEqual({
			status: 'ended',
			locked: false
		});
		program.free();
	});

	it('ends the program and puts the map back on Reset', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		program.runOrPause();
		program.playback.tick(0);
		program.playback.tick(300);
		program.reset();
		expect({
			status: program.status,
			locked: program.locked,
			position: program.playback.world.robot.position
		}).toEqual({ status: 'ready', locked: false, position: { x: 0, y: 0 } });
		program.free();
	});

	it('pauses a program that runs, and leaves any other as it is', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		program.pause();
		expect(program.status).toBe('ready');
		program.runOrPause();
		program.playback.tick(0);
		program.pause();
		expect(program.status).toBe('paused');
		program.free();
	});

	it('does nothing while the screen has no editor', () => {
		const program = programOf({ text: undefined });
		program.runOrPause();
		program.step();
		expect(program.status).toBe('ready');
		program.free();
	});
});
