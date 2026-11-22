import { describe, expect, it } from 'vitest';
import { SPEEDS } from '#lib/run/pace.ts';
import { speedChoices, speedName, type SpeedSetting } from './speeds.ts';
import { speedAt } from './test-support.ts';

describe('speedName', () => {
	it('names a speed by its steps per second, one step in the singular', () => {
		expect(SPEEDS.map(speedName)).toEqual([
			'1 step per second',
			'2 steps per second',
			'5 steps per second',
			'20 steps per second',
			'Instant'
		]);
	});
});

describe('speedChoices', () => {
	it('offers every speed of the list, from the slowest, each under its name', () => {
		const choices = speedChoices(speedAt(2));
		expect(choices.map(({ label }) => label)).toEqual(SPEEDS.map(speedName));
		expect(choices.map(({ id }) => id)).toEqual([
			'speed-1',
			'speed-2',
			'speed-5',
			'speed-20',
			'speed-instant'
		]);
	});

	it.each(SPEEDS.map((speed, index) => [speed, index] as const))(
		'marks the speed in use alone: %d',
		(speed, index) => {
			const marked = speedChoices(speedAt(speed)).map(({ chosen }) => chosen);
			expect(marked).toEqual(SPEEDS.map((_, at) => at === index));
		}
	);

	it('takes the speed of the choice chosen', () => {
		const setting = speedAt(2);
		const choices = speedChoices(setting);

		choices[3]?.choose();
		expect(setting.current).toBe(20);
		choices[4]?.choose();
		expect(setting.current).toBe(Infinity);
	});

	it('follows the setting as it changes: the choices are made once', () => {
		const setting = speedAt(2);
		const choices = speedChoices(setting);

		setting.choose(5);
		expect(choices.map(({ chosen }) => chosen)).toEqual([false, false, true, false, false]);
	});

	it('marks no choice for a speed that the list doesn’t hold', () => {
		const setting: SpeedSetting = { current: 3, choose: () => {} };
		expect(speedChoices(setting).some(({ chosen }) => chosen)).toBe(false);
	});
});
