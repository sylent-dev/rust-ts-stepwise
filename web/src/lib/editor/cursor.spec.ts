import { describe, expect, it } from 'vitest';
import { cursorOf } from './cursor.ts';
import { stateOf } from './test-support.ts';

describe('cursorOf', () => {
	it('gives the line and the column of the cursor, both from 1', () => {
		expect(cursorOf(stateOf('|forward()'))).toEqual({ line: 1, column: 1 });
		expect(cursorOf(stateOf('repeat 4:\n    forward(|)\n'))).toEqual({ line: 2, column: 13 });
		expect(cursorOf(stateOf('forward()\n|'))).toEqual({ line: 2, column: 1 });
	});

	it('counts the column in characters, as the core does, an emoji or an accent being one', () => {
		// The editor counts two units for the emoji, one for the letter with its accent.
		expect(cursorOf(stateOf('print("🤖 é|")'))).toEqual({ line: 1, column: 11 });
	});

	it('follows the end of the selection that moves, as the learner selects', () => {
		const down = stateOf('forward()\n|turn_left()|').update({
			selection: { anchor: 10, head: 21 }
		}).state;
		expect(cursorOf(down)).toEqual({ line: 2, column: 12 });
		const up = down.update({ selection: { anchor: 21, head: 3 } }).state;
		expect(cursorOf(up)).toEqual({ line: 1, column: 4 });
	});
});
