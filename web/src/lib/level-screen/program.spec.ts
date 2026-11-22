// The program of a level screen, on the sandbox of a corridor, through the module the page
// loads. The pace of its frames is tested with `Playback`: here, only what starts and what stops,
// read as the screen reads it.

import { afterAll, describe, expect, it } from 'vitest';
import { Sandbox } from '#lib/core/core.ts';
import { corridor, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import { pageOf, type TestPage } from '#lib/run/test-support.ts';
import { sandboxPlayground } from './playground.ts';
import { Program } from './program.ts';

loadTestCore();

/** A corridor of four cells, the robot on the first one, facing east. */
const sandbox = new Sandbox(sandboxOf(corridor('....')));
afterAll(() => {
	sandbox.free();
});

/** The page whose frames the program of the test asks for. */
let page: TestPage;

/** The program of an editor that holds `code.text`, which a test changes as a learner would. */
function programOf(code: { text: string | undefined }): Program {
	page = pageOf();
	return new Program(sandboxPlayground(sandbox), () => code.text, { frames: page.frames });
}

/** Draws the frames that the program asks for until nothing moves, one every 100 ms. */
function finish(): void {
	for (let time = 0; page.draw(time); time += 100);
}

describe('the program of a screen', () => {
	it('runs the code of the editor, then pauses and resumes it, the command named for each', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		expect({ status: program.status, action: program.action }).toEqual({
			status: 'ready',
			action: 'run'
		});
		program.runOrPause();
		page.draw(0);
		expect({
			status: program.status,
			action: program.action,
			steps: program.played.steps
		}).toEqual({ status: 'running', action: 'pause', steps: 1 });
		program.runOrPause();
		expect({ status: program.status, action: program.action }).toEqual({
			status: 'paused',
			action: 'resume'
		});
		program.runOrPause();
		expect(program.status).toBe('running');
		finish();
		expect({
			status: program.status,
			action: program.action,
			steps: program.played.steps
		}).toEqual({ status: 'ended', action: 'run', steps: 2 });
		program.free();
	});

	it('runs the code as it is when the program starts, from its start once it has stopped', () => {
		const code = { text: 'forward()\n' };
		const program = programOf(code);
		program.runOrPause();
		finish();
		expect(program.played.world.robot.position).toEqual({ x: 1, y: 0 });
		code.text = 'turn_left()\n';
		program.runOrPause();
		finish();
		expect(program.played.world.robot).toMatchObject({
			position: { x: 0, y: 0 },
			direction: 'north'
		});
		program.free();
	});

	it('starts nothing while the code has an error, and puts the map back', () => {
		const code = { text: 'forward()\n' };
		const program = programOf(code);
		program.runOrPause();
		finish();
		code.text = 'foward()\n';
		for (const command of ['runOrPause', 'step'] as const) {
			program[command]();
			expect(
				{ status: program.status, position: program.played.world.robot.position },
				command
			).toEqual({ status: 'ready', position: { x: 0, y: 0 } });
		}
		program.free();
	});

	it('tells an error that stops the program from its end', () => {
		const program = programOf({ text: 'pick_up()\n' });
		program.runOrPause();
		finish();
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
			line: program.played.line,
			steps: program.played.steps
		}).toEqual({ status: 'paused', line: 1, steps: 0 });
		program.step();
		finish();
		expect({
			status: program.status,
			line: program.played.line,
			steps: program.played.steps
		}).toEqual({ status: 'paused', line: 2, steps: 1 });
		program.free();
	});

	it('can’t step while it runs', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		expect(program.canStep).toBe(true);
		program.runOrPause();
		page.draw(0);
		expect(program.canStep).toBe(false);
		program.step();
		expect({ status: program.status, steps: program.played.steps }).toEqual({
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
		finish();
		expect({ status: program.status, locked: program.locked }).toEqual({
			status: 'ended',
			locked: false
		});
		program.free();
	});

	it('ends the program and puts the map back on Reset', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		program.runOrPause();
		page.draw(0);
		page.draw(300);
		program.reset();
		expect({
			status: program.status,
			locked: program.locked,
			position: program.played.world.robot.position
		}).toEqual({ status: 'ready', locked: false, position: { x: 0, y: 0 } });
		program.free();
	});

	it('pauses a program that runs, and leaves any other as it is', () => {
		const program = programOf({ text: 'forward()\nforward()\n' });
		program.pause();
		expect(program.status).toBe('ready');
		program.runOrPause();
		page.draw(0);
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
