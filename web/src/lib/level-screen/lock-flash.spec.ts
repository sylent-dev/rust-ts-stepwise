import { describe, expect, it } from 'vitest';
import { LockFlash } from './lock-flash.svelte.ts';

describe('LockFlash', () => {
	it('shows no flash until the learner tries to change the locked code', () => {
		expect(new LockFlash().number).toBe(0);
	});

	it('holds the reason, then fades, then ends', () => {
		const flash = new LockFlash();
		flash.refuse();
		expect([flash.number, flash.phase]).toEqual([1, 'hold']);
		flash.held();
		expect([flash.number, flash.phase]).toEqual([1, 'fade']);
		flash.end();
		expect(flash.number).toBe(0);
	});

	it('starts again from its hold at each new try, under a new number', () => {
		const flash = new LockFlash();
		flash.refuse();
		flash.held();
		flash.refuse();
		expect([flash.number, flash.phase]).toEqual([2, 'hold']);
	});

	it('ends at once once the code is free, and stays ended until a new try', () => {
		const flash = new LockFlash();
		flash.refuse();
		flash.end();
		flash.held();
		expect(flash.number).toBe(0);
		flash.refuse();
		expect([flash.number, flash.phase]).toEqual([2, 'hold']);
	});
});
