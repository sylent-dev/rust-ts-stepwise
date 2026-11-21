import { describe, expect, it } from 'vitest';
import { codeToOpen, hasChanged } from './code.ts';

describe('codeToOpen', () => {
	it('is the starting code at a first visit', () => {
		expect(codeToOpen(undefined, 'forward()')).toEqual({ text: 'forward()' });
	});

	it('is the code the learner left', () => {
		expect(codeToOpen({ text: 'turn_left()' }, 'forward()')).toEqual({ text: 'turn_left()' });
	});
});

describe('hasChanged', () => {
	it('is false for the starting code', () => {
		expect(hasChanged({ text: 'forward()' }, 'forward()')).toBe(false);
	});

	it('is true for a code that the learner changed', () => {
		expect(hasChanged({ text: 'forward()\nturn_left()' }, 'forward()')).toBe(true);
	});

	it('is true for a space that the learner added', () => {
		expect(hasChanged({ text: 'forward() ' }, 'forward()')).toBe(true);
	});
});
