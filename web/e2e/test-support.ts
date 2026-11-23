// What the tests in a real browser share: the level screen as the learner finds it, read by the
// roles and the names that a screen reader reads, and by the classes of the editor where it gives
// no role (the line lit, the underlines).
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Opens the sandbox in a browser that has never seen Stepwise (each test has a context of its
 * own), once its code can be typed: the sandbox, rather than a level, since its code and its map
 * don't change with the levels of the game.
 */
export async function openSandbox(page: Page): Promise<void> {
	await page.goto('sandbox');
	await expect(codeOf(page)).toBeVisible();
}

/** The code editor. */
export function codeOf(page: Page): Locator {
	return page.getByRole('textbox', { name: 'Your code' });
}

/** Replaces the whole code, as a text pasted: the editor indents nothing by itself. */
export async function writeCode(page: Page, text: string): Promise<void> {
	await codeOf(page).fill(text);
}

/** The code as the editor shows it, its lines joined. */
export async function codeText(page: Page): Promise<string> {
	return (await page.locator('.cm-line').allTextContents()).join('\n');
}

/** Waits until the editor shows this code. */
export async function expectCode(page: Page, text: string): Promise<void> {
	await expect.poll(() => codeText(page)).toBe(text);
}

/** A control of the program in the corner of the code, by what it does now. */
export function control(page: Page, name: 'Run' | 'Pause' | 'Resume' | 'Step' | 'Reset'): Locator {
	return page.getByRole('button', { name, exact: true });
}

/** The state of the program in the status bar (`Ready`, `Paused at line 2 · Reset to edit`…). */
export function stateOf(page: Page): Locator {
	return page.locator('.status-bar').getByRole('status');
}

/** The number of steps run, as the status bar counts them. */
export async function stepsRun(page: Page): Promise<number> {
	const text = (await page.locator('.status-bar .steps').textContent()) ?? '';
	const steps = /^(\d+) steps?$/.exec(text)?.[1];
	if (steps === undefined) throw new Error(`The status bar counts no steps: "${text}".`);
	return Number(steps);
}

/** The line of the next step, lit in the editor. */
export function litLine(page: Page): Locator {
	return page.locator('.cm-line.run-next');
}

/**
 * Starts to write down each line lit in the editor, by its number from 1, as it changes: a line
 * stays lit for half a second at the normal speed, shorter than the waits of `expect`. Gives what
 * was written down since.
 */
export async function followLitLines(page: Page): Promise<() => Promise<number[]>> {
	const record = await page.evaluateHandle(() => {
		const lit: number[] = [];
		const editor = document.querySelector('.cm-content');
		if (!editor) throw new Error('No code editor on the page.');
		const lines = () => [...editor.querySelectorAll('.cm-line')];
		new MutationObserver(() => {
			const line = lines().findIndex((each) => each.classList.contains('run-next')) + 1;
			if (line > 0 && lit.at(-1) !== line) lit.push(line);
		}).observe(editor, { subtree: true, childList: true, attributes: true });
		return lit;
	});
	return () => record.jsonValue();
}

/** The name of a menu in the bar of the header, which opens it. */
export function menuName(page: Page, name: string): Locator {
	return page.getByRole('menubar').getByRole('menuitem', { name, exact: true });
}

/**
 * Holds a key down long enough for the browser to repeat it, as a learner who leans on it: the
 * presses after the first arrive with `repeat` set.
 */
export async function holdKey(page: Page, key: string): Promise<void> {
	for (let press = 0; press < 4; press += 1) await page.keyboard.down(key);
	await page.keyboard.up(key);
}
