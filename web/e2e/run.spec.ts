// Running a program on the level screen (see Running a program in specs.md): the controls, the
// line lit in the editor, the status bar and the console, wired to the program that runs.
import { expect, test } from '@playwright/test';
import {
	codeOf,
	control,
	followLitLines,
	litLine,
	openSandbox,
	stateOf,
	stepsRun,
	writeCode
} from './test-support.ts';

test.beforeEach(async ({ page }) => {
	await openSandbox(page);
});

test('Run lights each line as it runs, then the program ends', async ({ page }) => {
	await writeCode(page, 'forward()\nturn_right()\nforward()\n');
	const lit = await followLitLines(page);

	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Running · Reset to edit');
	await expect(stateOf(page)).toHaveText('Ended');

	expect(await lit()).toEqual([1, 2, 3]);
	await expect(litLine(page)).toHaveCount(0);
	expect(await stepsRun(page)).toBe(3);
	await expect(control(page, 'Run')).toBeVisible();
});

test('Pause holds the program on its line, and Step runs the next one', async ({ page }) => {
	await writeCode(page, 'while true:\n    turn_right()\n');
	await control(page, 'Run').click();
	await control(page, 'Pause').click();

	await expect(stateOf(page)).toHaveText(/^Paused at line [12] · Reset to edit$/);
	const paused = Number(/line (\d)/.exec((await stateOf(page).textContent()) ?? '')?.[1]);
	const steps = await stepsRun(page);
	await expect(litLine(page)).toHaveText(paused === 1 ? 'while true:' : '    turn_right()');
	// At the normal speed, two steps a second: a program that went on would be seen.
	await page.waitForTimeout(1200);
	expect(await stepsRun(page)).toBe(steps);
	await expect(control(page, 'Resume')).toBeVisible();

	await page.keyboard.press('F10');
	const next = paused === 1 ? 2 : 1;
	await expect(stateOf(page)).toHaveText(`Paused at line ${next} · Reset to edit`);
	await expect(litLine(page)).toHaveText(next === 1 ? 'while true:' : '    turn_right()');
	expect(await stepsRun(page)).toBe(steps + 1);

	await control(page, 'Reset').click();
	await expect(stateOf(page)).toHaveText('Ready');
	await expect(litLine(page)).toHaveCount(0);
});

test('An error that stops the program is in the console, and its click shows its line', async ({
	page
}) => {
	await writeCode(page, 'print("start")\nlet zero = 0\nprint(10 / zero)\n');
	// The cursor on the first line, away from the error.
	await page.locator('.cm-line').first().click();
	await expect(page.locator('.status-bar .cursor')).toHaveText(/^Ln 1, Col \d+$/);

	await page.keyboard.press('Control+Enter');
	await expect(stateOf(page)).toHaveText('Error at line 3');
	const console = page.getByRole('region', { name: 'Console' });
	await expect(console).toContainText('start');
	const error = console.getByRole('button', { name: /^Ln 3 / });
	await expect(error).toContainText('The program divided by zero.');

	await error.click();
	await expect(page.locator('.status-bar .cursor')).toHaveText(/^Ln 3, Col \d+$/);
	await expect(codeOf(page)).toBeFocused();
});
