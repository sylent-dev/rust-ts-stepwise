// The sounds of a run (see Sounds in specs.md), wired to the setting **Sounds** and to the program
// that runs. A test hears nothing: the page writes down each note that it asks the Web Audio API
// for, by its first frequency, and the noise of a click, so that a test reads which sound played.
import type { Page } from '@playwright/test';
import { control, expect, openSandbox, stateOf, test, writeCode } from './test-support.ts';

/** What the page asked the Web Audio API for: the contexts made, the notes started. */
interface Heard {
	contexts: number;
	/** Each note by its first frequency, rounded to the hertz; `noise` for a burst of noise. */
	notes: (number | 'noise')[];
	/** The fades to silence asked for: each one a stop of what plays. */
	fades: number;
}

declare global {
	interface Window {
		/**
		 * Written by the init script of this file, before the application loads. Every file of
		 * `tsconfig.json` sees it, those of the application too, which never write it.
		 */
		heard?: Heard;
	}
}

/** The first notes of each sound, by their frequencies (the recipes of `lib/sounds/recipes.ts`). */
const SUCCESS = [523, 1047, 659, 1319, 784, 1568, 1047, 2093];
const FAILURE = [392];
const BUMP = [180, 432, 'noise'];
const MOVE = [659];
const TURN = [784, 659];

/** A move, a turn, then a bump into the top edge of the map of the sandbox. */
const BUMPING = 'forward()\nturn_left()\nforward()\n';

test.beforeEach(async ({ page }) => {
	// Every audio context of the page writes down what it is asked, before the application loads.
	await page.addInitScript(() => {
		const heard: Heard = { contexts: 0, notes: [], fades: 0 };
		window.heard = heard;
		class HeardContext extends AudioContext {
			constructor(options?: AudioContextOptions) {
				super(options);
				heard.contexts += 1;
			}

			override createOscillator(): OscillatorNode {
				const oscillator = super.createOscillator();
				const { frequency } = oscillator;
				const at = frequency.setValueAtTime.bind(frequency);
				const curve = frequency.setValueCurveAtTime.bind(frequency);
				let first = true;
				const note = (value: number | undefined) => {
					if (first && value !== undefined) heard.notes.push(Math.round(value));
					first = false;
				};
				frequency.setValueAtTime = (value, time) => {
					note(value);
					return at(value, time);
				};
				// The recipes give their curves as a `Float32Array`.
				frequency.setValueCurveAtTime = (values: Float32Array, time: number, length: number) => {
					note(values[0]);
					return curve(values, time, length);
				};
				return oscillator;
			}

			override createGain(): GainNode {
				const gain = super.createGain();
				const level = gain.gain;
				const target = level.setTargetAtTime.bind(level);
				level.setTargetAtTime = (value, time, constant) => {
					if (value === 0) heard.fades += 1;
					return target(value, time, constant);
				};
				return gain;
			}

			override createBufferSource(): AudioBufferSourceNode {
				heard.notes.push('noise');
				return super.createBufferSource();
			}
		}
		window.AudioContext = HeardContext;
	});
	await openSandbox(page);
});

/** What the page has asked for so far. */
async function heardIn(page: Page): Promise<Heard> {
	return page.evaluate(() => {
		const { heard } = window;
		if (!heard) throw new Error('the init script of the test wrote nothing');
		return { contexts: heard.contexts, notes: [...heard.notes], fades: heard.fades };
	});
}

/** Forgets the notes asked for so far, to read the ones that come next. */
async function forget(page: Page): Promise<void> {
	await page.evaluate(() => {
		if (window.heard) window.heard.notes.length = 0;
	});
}

/** Turns **Sounds** off in the panel of the settings, then closes it. */
async function turnSoundsOff(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('radio', { name: 'Off' }).click();
	await page.keyboard.press('Escape');
}

/** Turns **Sounds** on in the panel of the settings, then closes it. */
async function turnSoundsOn(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('radio', { name: 'On' }).click();
	await page.keyboard.press('Escape');
}

test('the sounds stay off at first: a run opens no audio of the system', async ({ page }) => {
	await writeCode(page, BUMPING);
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Error at line 3');
	expect(await heardIn(page)).toEqual({ contexts: 0, notes: [], fades: 0 });
});

test('Sounds turned on plays a success once, then a run plays its move, its turn and its bump', async ({
	page
}) => {
	await turnSoundsOn(page);
	await expect.poll(async () => (await heardIn(page)).notes).toEqual(SUCCESS);
	await forget(page);

	await writeCode(page, BUMPING);
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Error at line 3');
	// The Run fades out what the success still played.
	expect(await heardIn(page)).toEqual({
		contexts: 1,
		notes: [...MOVE, ...TURN, ...BUMP],
		fades: 1
	});
});

test('a Run that the checks refuse plays the soft slide', async ({ page }) => {
	await turnSoundsOn(page);
	await forget(page);

	await writeCode(page, 'forwrd()\n');
	await control(page, 'Run').click();
	await expect(page.getByText('Fix this error to run the program.')).toBeVisible();
	await expect.poll(async () => (await heardIn(page)).notes).toEqual(FAILURE);
});

test('Sounds turned off fades out what still plays, in this tab and from another one', async ({
	page
}) => {
	await turnSoundsOn(page);
	await turnSoundsOff(page);
	await expect.poll(async () => (await heardIn(page)).fades).toBe(1);

	// Turned on again here, then off in another tab, which this one follows.
	await turnSoundsOn(page);
	const other = await page.context().newPage();
	await openSandbox(other);
	await turnSoundsOff(other);
	await expect.poll(async () => (await heardIn(page)).fades).toBe(2);
});
