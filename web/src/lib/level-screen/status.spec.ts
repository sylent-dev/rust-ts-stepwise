import { describe, expect, it } from 'vitest';
import type { Outcome } from '#lib/core/core.ts';
import type { PlaybackStatus } from '#lib/run/playback.svelte.ts';
import { type ProgramStatus, statusState } from './status.ts';

/** A program where it stands, on its line, stopped as `outcome` says. */
function program(status: PlaybackStatus, line?: number, outcome?: Outcome): ProgramStatus {
	return { status, line, atBreakpoint: false, outcome };
}

const FAILED: Outcome = {
	type: 'failed',
	error: { span: { line: 3, from: 20, to: 29 }, kind: { code: 'bump' } }
};

describe('statusState', () => {
	it('says Ready until the program starts, and while the screen has none', () => {
		expect(statusState(program('ready'), 1)).toEqual({ text: 'Ready', tone: 'band' });
		expect(statusState(undefined, undefined)).toEqual({ text: 'Ready', tone: 'band' });
	});

	it('says that the code can’t be changed while the program runs or is paused', () => {
		expect(statusState(program('running', 5), 1)).toEqual({
			text: 'Running · Reset to edit',
			tone: 'band'
		});
		expect(statusState(program('paused', 5), 1)).toEqual({
			text: 'Paused at line 5 · Reset to edit',
			tone: 'paused'
		});
	});

	it('names the breakpoint that paused the program', () => {
		expect(statusState({ ...program('paused', 10), atBreakpoint: true }, 1)).toEqual({
			text: 'Paused at line 10 · breakpoint · Reset to edit',
			tone: 'paused'
		});
	});

	it('gives the line of the error that stopped the program, in the error color', () => {
		expect(statusState(program('failed', undefined, FAILED), 1)).toEqual({
			text: 'Error at line 3',
			tone: 'failed'
		});
	});

	it('says that the program ended, and how, a map passed in teal', () => {
		expect(statusState(program('ended', undefined, { type: 'passed' }), 2)).toEqual({
			text: 'Ended · map 2 passed',
			tone: 'passed'
		});
		const missed: Outcome = { type: 'goals-not-met', goals: [{ type: 'carrying' }] };
		expect(statusState(program('ended', undefined, missed), 1)).toEqual({
			text: 'Ended · goal not met',
			tone: 'band'
		});
	});

	it('says Ended alone in the sandbox, which has no goal', () => {
		expect(statusState(program('ended', undefined, { type: 'ended' }), undefined)).toEqual({
			text: 'Ended',
			tone: 'band'
		});
	});

	it('still says what it can in a state that a program never reaches', () => {
		// Paused without a line, stopped without an outcome, a map passed in the sandbox.
		expect(statusState(program('paused'), 1)).toEqual({
			text: 'Running · Reset to edit',
			tone: 'paused'
		});
		expect(statusState(program('ended'), 1)).toEqual({ text: 'Ended', tone: 'band' });
		expect(statusState(program('ended', undefined, { type: 'passed' }), undefined)).toEqual({
			text: 'Ended',
			tone: 'passed'
		});
	});
});
