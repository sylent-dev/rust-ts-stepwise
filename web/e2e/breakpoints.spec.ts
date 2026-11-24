// The breakpoints (see Code editor and Running a program in specs.md): set in the margin or with
// F9, saved with the code, and the program that pauses before their line.
import {
	breakpointDots,
	clickMargin,
	codeOf,
	control,
	expect,
	lineOf,
	menuName,
	openSandbox,
	savedBreakpoints,
	stateOf,
	stepsRun,
	test,
	writeCode
} from './test-support.ts';

test.beforeEach(async ({ page }) => {
	await openSandbox(page);
});

test('A click in the margin sets a breakpoint, which pauses the program before its line', async ({
	page
}) => {
	await writeCode(page, 'forward()\nturn_right()\nforward()\n');
	await clickMargin(page, 3);
	await expect(breakpointDots(page)).toHaveCount(1);
	await expect.poll(() => savedBreakpoints(page)).toEqual([3]);

	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Paused at line 3 · breakpoint · Reset to edit');
	expect(await stepsRun(page)).toBe(2);
	await control(page, 'Resume').click();
	await expect(stateOf(page)).toHaveText('Ended');

	// A second click takes it away.
	await clickMargin(page, 3);
	await expect(breakpointDots(page)).toHaveCount(0);
	await expect.poll(() => savedBreakpoints(page)).toEqual([]);
});

test('F9 sets a breakpoint on the next line that runs, while the program runs too', async ({
	page
}) => {
	await writeCode(page, 'while true:\n\n    turn_right()\n');
	await lineOf(page, 2).click();
	await page.keyboard.press('F9');
	await expect.poll(() => savedBreakpoints(page)).toEqual([3]);
	await page.keyboard.press('F9');
	await expect.poll(() => savedBreakpoints(page)).toEqual([]);

	// The code is locked while the program runs; its breakpoints aren't.
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Running · Reset to edit');
	await codeOf(page).focus();
	await page.keyboard.press('F9');
	await expect(stateOf(page)).toHaveText('Paused at line 3 · breakpoint · Reset to edit');
});

test('The breakpoints come back after a reload, and Restore starting code takes them away', async ({
	page
}) => {
	await writeCode(page, 'forward()\nforward()\n');
	await clickMargin(page, 1);
	await clickMargin(page, 2);
	await expect(breakpointDots(page)).toHaveCount(2);

	await page.reload();
	await expect(codeOf(page)).toBeVisible();
	await expect(breakpointDots(page)).toHaveCount(2);

	await menuName(page, 'Edit').click();
	await page.getByRole('menuitem', { name: 'Remove all breakpoints' }).click();
	await expect(breakpointDots(page)).toHaveCount(0);
	await menuName(page, 'Edit').click();
	await expect(page.getByRole('menuitem', { name: 'Remove all breakpoints' })).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await page.keyboard.press('Escape');

	// Restore starting code puts the level back without breakpoints.
	await clickMargin(page, 2);
	await expect(breakpointDots(page)).toHaveCount(1);
	await menuName(page, 'Level').click();
	await page.getByRole('menuitem', { name: 'Restore starting code…' }).click();
	await page.getByRole('button', { name: 'Restore starting code' }).click();
	await expect(breakpointDots(page)).toHaveCount(0);
	await expect.poll(() => savedBreakpoints(page)).toBeUndefined();
});
