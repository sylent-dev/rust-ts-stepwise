import { describe, expect, it } from 'vitest';
import { tabAfter, type TabPress } from './tab-keys.ts';

/** A press of a key alone, or with the keys held that `held` says. */
function press(key: string, held: Partial<TabPress> = {}): TabPress {
	return { key, ctrlKey: false, altKey: false, metaKey: false, ...held };
}

describe('tabAfter', () => {
	it('goes to the tab beside the one shown with the arrows', () => {
		expect(tabAfter(press('ArrowRight'), 0, 3)).toBe(1);
		expect(tabAfter(press('ArrowLeft'), 2, 3)).toBe(1);
	});

	it('goes from the last tab to the first, and back', () => {
		expect(tabAfter(press('ArrowRight'), 2, 3)).toBe(0);
		expect(tabAfter(press('ArrowLeft'), 0, 3)).toBe(2);
		expect(tabAfter(press('ArrowRight'), 1, 2)).toBe(0);
		expect(tabAfter(press('ArrowLeft'), 0, 2)).toBe(1);
	});

	it('goes to the first and the last tab with Home and End', () => {
		expect(tabAfter(press('Home'), 2, 3)).toBe(0);
		expect(tabAfter(press('End'), 0, 3)).toBe(2);
	});

	it('goes nowhere for another key', () => {
		for (const key of ['ArrowUp', 'ArrowDown', 'Enter', ' ', 'Tab', 'a']) {
			expect(tabAfter(press(key), 1, 3), key).toBeUndefined();
		}
	});

	it('leaves a key held with Ctrl, Alt or Cmd to the browser and the screen', () => {
		expect(tabAfter(press('ArrowLeft', { altKey: true }), 1, 3)).toBeUndefined();
		expect(tabAfter(press('ArrowRight', { ctrlKey: true }), 1, 3)).toBeUndefined();
		expect(tabAfter(press('Home', { metaKey: true }), 1, 3)).toBeUndefined();
	});
});
