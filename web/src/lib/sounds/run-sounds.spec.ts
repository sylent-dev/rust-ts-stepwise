import { describe, expect, it } from 'vitest';
import type { Outcome, RuntimeErrorKind } from '#lib/core/core.ts';
import { actionSound, BLIP_MAX_RATE, REFUSED_SOUND, stopSound } from './run-sounds.ts';

/** A program stopped by the error `kind`. */
function failed(kind: RuntimeErrorKind): Outcome {
	return { type: 'failed', error: { span: { line: 1, from: 0, to: 9 }, kind } };
}

describe('the sound of an action', () => {
	it('blips as a move or a turn starts, up to 2 steps per second', () => {
		expect(BLIP_MAX_RATE).toBe(2);
		for (const rate of [1, 2]) {
			expect(actionSound('moved', 300, rate)).toEqual({ sound: 'move', delay: 0 });
			expect(actionSound('turned-left', 300, rate)).toEqual({ sound: 'turn', delay: 0 });
			expect(actionSound('turned-right', 300, rate)).toEqual({ sound: 'turn', delay: 0 });
		}
	});

	it('leaves the moves and the turns silent at a faster speed', () => {
		for (const rate of [5, 20, Infinity]) {
			expect(actionSound('moved', 160, rate)).toBeUndefined();
			expect(actionSound('turned-right', 160, rate)).toBeUndefined();
		}
	});

	it('leaves silent what its animation shows: painting, erasing, an item', () => {
		for (const action of ['started-painting', 'started-erasing', 'picked-up', 'dropped'] as const) {
			expect(actionSound(action, 300, 1)).toBeUndefined();
		}
	});

	it('plays the spring of a bump as the front of the robot touches its wall', () => {
		expect(actionSound('bump', 450, 2)).toEqual({ sound: 'bump', delay: 135 });
		// Shown at once, at **Instant**.
		expect(actionSound('bump', 0, Infinity)).toEqual({ sound: 'bump', delay: 0 });
	});

	it('plays the spring of an item that fails as the robot starts to shake', () => {
		for (const action of [
			'already-carrying',
			'no-item-here',
			'not-carrying',
			'item-already-here'
		] as const) {
			expect(actionSound(action, 650, 20)).toEqual({ sound: 'bump', delay: 390 });
			// Shown by its error alone, with less motion or at **Instant**.
			expect(actionSound(action, 0, 2)).toEqual({ sound: 'bump', delay: 0 });
		}
	});

	it('plays the end of a run as the robot shows it', () => {
		expect(actionSound('passed', 900, 2)).toEqual({ sound: 'success', delay: 0 });
		expect(actionSound('goals-not-met', 0, Infinity)).toEqual({ sound: 'failure', delay: 0 });
	});
});

describe('the sound of a program that stopped', () => {
	it('slides down for an error that the map doesn’t show', () => {
		expect(stopSound(failed({ code: 'division-by-zero' }))).toEqual({
			sound: 'failure',
			delay: 0
		});
		expect(stopSound(failed({ code: 'too-many-calls', function: 'spin', limit: 200 }))).toEqual({
			sound: 'failure',
			delay: 0
		});
	});

	it('plays nothing more for an error of the robot, nor for an end that the robot shows', () => {
		expect(stopSound(failed({ code: 'bump' }))).toBeUndefined();
		expect(stopSound(failed({ code: 'no-item-here' }))).toBeUndefined();
		expect(stopSound({ type: 'passed' })).toBeUndefined();
		expect(stopSound({ type: 'goals-not-met', goals: [{ type: 'carrying' }] })).toBeUndefined();
	});

	it('plays nothing for a program of the sandbox that ran to its end', () => {
		expect(stopSound({ type: 'ended' })).toBeUndefined();
	});
});

describe('the sound of a Run that the checks refuse', () => {
	it('is the soft slide, at once', () => {
		expect(REFUSED_SOUND).toEqual({ sound: 'failure', delay: 0 });
	});
});
