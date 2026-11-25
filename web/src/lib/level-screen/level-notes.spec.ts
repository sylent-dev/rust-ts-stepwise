import { describe, expect, it } from 'vitest';
import type { Color, GoalNotMet } from '#lib/core/core.ts';
import { PAINT_COLORS } from '#lib/map/paint-colors.ts';
import { goalNotes, passedNote } from './level-notes.ts';

/** The texts of the notes of goals not met. */
function texts(goals: readonly GoalNotMet[]): string[] {
	return goalNotes(goals).map(({ kind, text }) => `${kind}: ${text}`);
}

const at = (x: number, y: number) => ({ x, y });

describe('goalNotes', () => {
	it('says each kind of goal not met in its own words', () => {
		expect(texts([{ type: 'robot-not-at', at: at(1, 1) }])).toEqual([
			'goal: The goal is not met: the robot is not in the right place.'
		]);
		expect(texts([{ type: 'not-carrying' }])).toEqual([
			'goal: The goal is not met: the robot carries no item.'
		]);
		expect(texts([{ type: 'carrying' }])).toEqual([
			'goal: The goal is not met: the robot carries an item.'
		]);
	});

	it('counts the cells of each paint, in one note per paint', () => {
		expect(
			texts([
				{ type: 'paint-missing', at: at(1, 1), color: 'red' },
				{ type: 'paint-missing', at: at(2, 1), color: 'blue' },
				{ type: 'paint-missing', at: at(3, 1), color: 'red' },
				{ type: 'paint-missing', at: at(4, 1), color: 'red' }
			])
		).toEqual([
			'goal: The goal is not met: 3 cells are not red.',
			'goal: The goal is not met: 1 cell is not blue.'
		]);
		expect(texts([{ type: 'paint-missing', at: at(1, 1), color: 'yellow' }])).toEqual([
			'goal: The goal is not met: 1 cell is not yellow.'
		]);
	});

	it('names every color of the core, never another one in its place', () => {
		// The message picks the word of a color, `blue` by default: a new color must be given its
		// own. The table of the paints holds every color of the core, and no other.
		const colors = Object.keys(PAINT_COLORS).filter((name): name is Color => name in PAINT_COLORS);
		expect(colors).toEqual(Object.keys(PAINT_COLORS));
		for (const color of colors) {
			expect(texts([{ type: 'paint-missing', at: at(1, 1), color }])).toEqual([
				`goal: The goal is not met: 1 cell is not ${color}.`
			]);
		}
	});

	it('counts the cells painted outside the goal and the item slots left empty', () => {
		expect(
			texts([
				{ type: 'painted-elsewhere', at: at(0, 0) },
				{ type: 'painted-elsewhere', at: at(0, 1) },
				{ type: 'item-missing', at: at(5, 5) }
			])
		).toEqual([
			'goal: The goal is not met: 2 cells are painted outside the goal.',
			'goal: The goal is not met: 1 item slot is empty.'
		]);
		expect(texts([{ type: 'painted-elsewhere', at: at(0, 0) }])).toEqual([
			'goal: The goal is not met: 1 cell is painted outside the goal.'
		]);
		expect(
			texts([
				{ type: 'item-missing', at: at(5, 5) },
				{ type: 'item-missing', at: at(6, 5) }
			])
		).toEqual(['goal: The goal is not met: 2 item slots are empty.']);
	});

	it('keeps the order of the goals, as the core gives them', () => {
		expect(
			texts([
				{ type: 'robot-not-at', at: at(1, 1) },
				{ type: 'paint-missing', at: at(2, 1), color: 'red' },
				{ type: 'painted-elsewhere', at: at(0, 0) },
				{ type: 'item-missing', at: at(5, 5) },
				{ type: 'carrying' }
			])
		).toEqual([
			'goal: The goal is not met: the robot is not in the right place.',
			'goal: The goal is not met: 1 cell is not red.',
			'goal: The goal is not met: 1 cell is painted outside the goal.',
			'goal: The goal is not met: 1 item slot is empty.',
			'goal: The goal is not met: the robot carries an item.'
		]);
	});
});

describe('passedNote', () => {
	it('names the first map that the code hasn’t passed yet', () => {
		expect(passedNote(1, 3, new Set([1]))).toEqual({
			kind: 'passed',
			text: 'Map 1 passed. Try map 2.'
		});
		expect(passedNote(3, 3, new Set([3]))).toEqual({
			kind: 'passed',
			text: 'Map 3 passed. Try map 1.'
		});
		expect(passedNote(1, 3, new Set([1, 2]))).toEqual({
			kind: 'passed',
			text: 'Map 1 passed. Try map 3.'
		});
	});

	it('says the level done once every map has passed with the code', () => {
		expect(passedNote(3, 3, new Set([1, 2, 3]))).toEqual({
			kind: 'passed',
			text: 'Map 3 passed. Level done!'
		});
	});

	it('says the level done alone for a level of one map, which shows no tab', () => {
		expect(passedNote(1, 1, new Set([1]))).toEqual({ kind: 'passed', text: 'Level done!' });
	});
});
