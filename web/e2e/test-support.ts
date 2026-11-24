// What the tests in a real browser share: the test itself, which fails when the page says that
// something went wrong, and the level screen as the learner finds it, read by the roles and the
// names that a screen reader reads. Where the screen gives none (the lines of the editor and its
// underlines, the status bar, among three places of the page that are `status`), this file alone
// knows the classes and the markup that the tests read.
import { test as base, expect, type Locator, type Page } from '@playwright/test';

/**
 * The test of Playwright, which fails when the page throws, or writes an error or a warning: a
 * message missing from the Fluent files, an effect that throws, the core that can't load.
 */
export const test = base.extend<{ quietPage: undefined }>({
	quietPage: [
		async ({ page }, use) => {
			const heard: string[] = [];
			page.on('pageerror', (error) => heard.push(error.message));
			page.on('console', (message) => {
				if (message.type() !== 'error' && message.type() !== 'warning') return;
				// A file that doesn't come is named apart from its message.
				const { url } = message.location();
				heard.push(url ? `${message.text()} (${url})` : message.text());
			});
			await use(undefined);
			expect(heard, 'What the page threw, or wrote as an error or a warning').toEqual([]);
		},
		{ auto: true }
	]
});

export { expect };

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

/** A line of the code, from 1, among the lines that the editor draws, as `codeText` reads them. */
export function lineOf(page: Page, number: number): Locator {
	return page.locator('.cm-line').nth(number - 1);
}

/**
 * The code as the editor shows it, its lines joined: the lines that it draws, which are all of
 * them for a code that fits in the editor.
 */
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

/** The status bar under the code. */
function statusBar(page: Page): Locator {
	return page.locator('.status-bar');
}

/** The state of the program in the status bar (`Ready`, `Paused at line 2 · Reset to edit`…). */
export function stateOf(page: Page): Locator {
	return statusBar(page).getByRole('status');
}

/** The line where the program is paused, as the status bar says it. */
export async function pausedLine(page: Page): Promise<number> {
	const text = (await stateOf(page).textContent()) ?? '';
	const line = /^Paused at line (\d+) · Reset to edit$/.exec(text)?.[1];
	if (line === undefined) throw new Error(`The status bar says no paused line: "${text}".`);
	return Number(line);
}

/** The number of steps run, as the status bar counts them. */
export async function stepsRun(page: Page): Promise<number> {
	const text =
		(await statusBar(page)
			.getByText(/^\d+ steps?$/)
			.textContent()) ?? '';
	const steps = /^(\d+) steps?$/.exec(text)?.[1];
	if (steps === undefined) throw new Error(`The status bar counts no steps: "${text}".`);
	return Number(steps);
}

/** The place of the cursor in the status bar (`Ln 3, Col 1`). */
export function cursorOf(page: Page): Locator {
	return statusBar(page).getByText(/^Ln \d+, Col \d+$/);
}

/**
 * Waits until the status bar shows no flash, the amber that fades under the state included,
 * within `timeout` when given.
 */
export async function expectNoFlash(page: Page, timeout?: number): Promise<void> {
	await expect(statusBar(page)).not.toHaveClass(/flashing/, { timeout });
}

/**
 * Clicks the margin of a line, left of its number, where a click sets or removes a breakpoint;
 * or `below` pixels under the middle of the line.
 */
export async function clickMargin(page: Page, number: number, below = 0): Promise<void> {
	const line = await lineOf(page, number).boundingBox();
	const margin = await page.locator('.margin-marks').boundingBox();
	if (!line || !margin) throw new Error('The margin of the code, or its line, isn’t drawn.');
	await page.mouse.click(margin.x + margin.width / 2, line.y + line.height / 2 + below);
}

/** The dots of the breakpoints in the margin. */
export function breakpointDots(page: Page): Locator {
	return page.locator('.breakpoint-dot');
}

/** The lines of the breakpoints saved with the code of the sandbox, as the browser keeps them. */
export async function savedBreakpoints(page: Page): Promise<unknown> {
	return page.evaluate(() => {
		const saved: unknown = JSON.parse(localStorage.getItem('stepwise.code') ?? 'null');
		if (typeof saved !== 'object' || saved === null || !('levels' in saved)) return undefined;
		const { levels } = saved;
		if (typeof levels !== 'object' || levels === null || !('sandbox' in levels)) return undefined;
		const { sandbox } = levels;
		if (typeof sandbox !== 'object' || sandbox === null || !('breakpoints' in sandbox)) {
			return undefined;
		}
		return sandbox.breakpoints;
	});
}

/** The line of the next step, lit in the editor. */
export function litLine(page: Page): Locator {
	return page.locator('.cm-line.run-next');
}

/**
 * Starts to write down each line lit in the editor as it changes, as `<number> <text>`: the
 * number that the margin lights, and the text of the line lit in the code. A line stays lit for
 * half a second at the normal speed, shorter than the waits of `expect`. Gives what was written
 * down since.
 */
export async function followLitLines(page: Page): Promise<() => Promise<string[]>> {
	const record = await page.evaluateHandle(() => {
		const lit: string[] = [];
		const editor = document.querySelector('.cm-editor');
		if (!editor) throw new Error('No code editor on the page.');
		new MutationObserver(() => {
			const number = editor.querySelector('.cm-lineNumbers .run-next')?.textContent;
			const text = editor.querySelector('.cm-line.run-next')?.textContent;
			if (number === undefined || text === undefined) return;
			const line = `${number} ${text}`;
			if (lit.at(-1) !== line) lit.push(line);
		}).observe(editor, { subtree: true, childList: true, attributes: true, characterData: true });
		return lit;
	});
	return () => record.jsonValue();
}

/**
 * A panel under the map, by its name: in the window of the tests, narrower than 1,600 pixels, the
 * panel of its tab.
 */
export function panelOf(page: Page, name: 'Console' | 'Variables'): Locator {
	return page.getByRole('tabpanel', { name });
}

/** The tab of a panel under the map. */
export function panelTab(page: Page, name: 'Console' | 'Variables'): Locator {
	return page.getByRole('tab', { name });
}

/** Whether the tab of the variables shows the dot of the state at an error. */
export function variablesDot(page: Page): Locator {
	return panelTab(page, 'Variables').and(page.locator('.has-dot'));
}

/**
 * The variables that the panel shows, each as `<name>=<value>`, the ones that the last step
 * changed after a `*`.
 */
export async function shownVariables(page: Page): Promise<string[]> {
	return panelOf(page, 'Variables')
		.locator('dl > div')
		.evaluateAll((rows) =>
			rows.map((row) => {
				const name = row.querySelector('dt')?.textContent ?? '';
				const value = row.querySelector('dd')?.textContent ?? '';
				return `${row.classList.contains('is-changed') ? '*' : ''}${name}=${value}`;
			})
		);
}

/** The calls in progress that the panel lists, each a button by its function and its line. */
export function callOf(page: Page, name: string): Locator {
	return panelOf(page, 'Variables').getByRole('button', { name, exact: true });
}

/** The words that the checks underline as an error. */
export function errorUnderlines(page: Page): Locator {
	return page.locator('.underline-error');
}

/** What the underlines under the pointer say. */
export function underlineTip(page: Page): Locator {
	return page.locator('.underline-tip');
}

/** The name of a menu in the bar of the header, which opens it. */
export function menuName(page: Page, name: string): Locator {
	return page.getByRole('menubar').getByRole('menuitem', { name, exact: true });
}

/** The keys that a row of the panel of the shortcuts gives for what it names. */
export function shortcutKeys(panel: Locator, name: string): Locator {
	return panel
		.locator('dl > div')
		.filter({ has: panel.page().getByRole('term').filter({ hasText: name }) })
		.getByRole('definition');
}

/**
 * The presses of a key that a learner leans on: a first one, then three more, which Playwright
 * sends with `repeat` set, as the browser sends those of a key held down; the key stays down.
 */
export async function leanOn(page: Page, key: string): Promise<void> {
	for (let press = 0; press < 4; press += 1) await page.keyboard.down(key);
}

/** A key that a learner leans on, then lets go. */
export async function holdKey(page: Page, key: string): Promise<void> {
	await leanOn(page, key);
	await page.keyboard.up(key);
}
