import { describe, expect, it } from 'vitest';
import type { Outcome, RuntimeErrorKind, StepEvent } from '#lib/core/core.ts';
import { actionTime, isAnimated, isRunEnd, robotFailure, runEnd, type Action } from './actions.ts';

describe('isAnimated', () => {
	it('animates a move, a turn, a tool put down and an item', () => {
		const events: StepEvent[] = [
			'moved',
			'turned-left',
			'turned-right',
			'started-painting',
			'started-erasing',
			'picked-up',
			'dropped'
		];
		expect(events.filter(isAnimated)).toEqual(events);
	});

	it('moves the line on at once after a line without action or a tool lifted', () => {
		const events: StepEvent[] = ['nothing', 'printed', 'stopped-painting', 'stopped-erasing'];
		expect(events.filter(isAnimated)).toEqual([]);
	});
});

describe('robotFailure', () => {
	const failed = (kind: RuntimeErrorKind): Outcome => ({
		type: 'failed',
		error: { span: { line: 1, from: 0, to: 9 }, kind }
	});

	it('gives the errors of the robot that the map shows', () => {
		const codes = [
			'bump',
			'already-carrying',
			'no-item-here',
			'not-carrying',
			'item-already-here'
		] as const;
		expect(codes.map((code) => robotFailure(failed({ code })))).toEqual(codes);
	});

	it('gives nothing for another error, a run that ended well, or one that still runs', () => {
		expect(robotFailure(failed({ code: 'division-by-zero' }))).toBeUndefined();
		expect(robotFailure({ type: 'passed' })).toBeUndefined();
		expect(robotFailure(undefined)).toBeUndefined();
	});
});

describe('runEnd', () => {
	it('gives the end of a run on a map of a level, every goal met or not', () => {
		expect(runEnd({ type: 'passed' })).toBe('passed');
		expect(runEnd({ type: 'goals-not-met', goals: [{ type: 'carrying' }] })).toBe('goals-not-met');
		expect(isRunEnd('passed') && isRunEnd('goals-not-met')).toBe(true);
		expect(isRunEnd('moved') || isRunEnd('bump')).toBe(false);
	});

	it('gives nothing for the sandbox, an error, or a run under way', () => {
		const failed: Outcome = {
			type: 'failed',
			error: { span: { line: 1, from: 0, to: 9 }, kind: { code: 'bump' } }
		};
		expect([{ type: 'ended' } as const, failed, undefined].map(runEnd)).toEqual([
			undefined,
			undefined,
			undefined
		]);
	});
});

describe('actionTime', () => {
	const SPEEDS = [1, 2, 5, 20, Infinity];
	const times = (action: Action, lessMotion = false) =>
		SPEEDS.map((rate) => actionTime(action, rate, lessMotion));

	it('takes 300 ms for a move up to the normal speed, then 80 % of a step', () => {
		expect(times('moved')).toEqual([300, 300, 160, 40, 0]);
	});

	it('takes 400 ms for an item up to the normal speed, then 80 % of a step', () => {
		expect(times('picked-up')).toEqual([400, 400, 160, 40, 0]);
	});

	it('keeps the whole time of an error of the robot at every animated speed', () => {
		expect(times('bump')).toEqual([450, 450, 450, 450, 0]);
		expect(times('no-item-here')).toEqual([650, 650, 650, 650, 0]);
	});

	it('keeps the whole time of the end of a run at every animated speed', () => {
		expect(times('passed')).toEqual([900, 900, 900, 900, 0]);
		expect(times('goals-not-met')).toEqual([900, 900, 900, 900, 0]);
	});

	it('takes no time with less motion for an action that fails and the end of a run', () => {
		expect(times('item-already-here', true)).toEqual([0, 0, 0, 0, 0]);
		expect(times('passed', true)).toEqual([0, 0, 0, 0, 0]);
		// The moves, the items and the bump keep their time.
		expect(times('turned-left', true)).toEqual([300, 300, 160, 40, 0]);
		expect(times('dropped', true)).toEqual([400, 400, 160, 40, 0]);
		expect(times('bump', true)).toEqual([450, 450, 450, 450, 0]);
	});
});
