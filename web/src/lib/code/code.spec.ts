import { describe, expect, it } from 'vitest';
import { canRestore, codeToOpen } from './code.ts';

describe('codeToOpen', () => {
	it('is the starting code at a first visit', () => {
		expect(codeToOpen(undefined, 'forward()')).toEqual({ text: 'forward()' });
	});

	it('is the code the learner left', () => {
		expect(codeToOpen({ text: 'turn_left()' }, 'forward()')).toEqual({ text: 'turn_left()' });
	});
});

describe('canRestore', () => {
	it('has nothing to restore in the starting code', () => {
		expect(canRestore({ text: 'forward()' }, 'forward()')).toBe(false);
	});

	it('restores a code that the learner changed', () => {
		expect(canRestore({ text: 'forward()\nturn_left()' }, 'forward()')).toBe(true);
	});

	it('restores even a space that the learner added', () => {
		expect(canRestore({ text: 'forward() ' }, 'forward()')).toBe(true);
	});
});
