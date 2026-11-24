import { describe, expect, it } from 'vitest';
import { codeToOpen, differsFromStart } from './code.ts';

describe('codeToOpen', () => {
	it('is the starting code without breakpoints at a first visit', () => {
		expect(codeToOpen(undefined, 'forward()')).toEqual({ text: 'forward()', breakpoints: [] });
	});

	it('is the code the learner left, with its breakpoints', () => {
		const left = { text: 'turn_left()\nforward()', breakpoints: [2] };
		expect(codeToOpen(left, 'forward()')).toEqual(left);
	});
});

describe('differsFromStart', () => {
	it('is false for the starting code without breakpoints', () => {
		expect(differsFromStart({ text: 'forward()', breakpoints: [] }, 'forward()')).toBe(false);
	});

	it('is true for a code that the learner changed', () => {
		const changed = { text: 'forward()\nturn_left()', breakpoints: [] };
		expect(differsFromStart(changed, 'forward()')).toBe(true);
	});

	it('is true for a space that the learner added', () => {
		expect(differsFromStart({ text: 'forward() ', breakpoints: [] }, 'forward()')).toBe(true);
	});

	it('is true for the starting code with a breakpoint', () => {
		expect(differsFromStart({ text: 'forward()', breakpoints: [1] }, 'forward()')).toBe(true);
	});
});
