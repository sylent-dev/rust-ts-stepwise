// The variables panel (see Variables panel in specs.md): its tab beside the console, which follows
// the program, and the calls in progress, a click on one showing its variables.
import {
	callOf,
	control,
	expect,
	openSandbox,
	panelOf,
	panelTab,
	shownVariables,
	stateOf,
	test,
	variablesDot,
	writeCode
} from './test-support.ts';

test.beforeEach(async ({ page }) => {
	await openSandbox(page);
});

const SQUARE = `function paint_side(length):
    let done = length

function paint_square(side):
    paint_side(side)
    paint_side(side + 1)

let sides = 4
paint_square(3)
`;

test('A pause shows the variables, and a call clicked stays shown while it is in progress', async ({
	page
}) => {
	await writeCode(page, SQUARE);
	await expect(panelOf(page, 'Variables')).toBeHidden();

	// Paused before the first line: the main program, without variables yet.
	await control(page, 'Step').click();
	await expect(panelTab(page, 'Variables')).toHaveAttribute('aria-selected', 'true');
	await expect(panelOf(page, 'Variables')).toContainText('No variables yet.');

	// Into the first call of `paint_side`.
	for (let steps = 0; steps < 3; steps += 1) await control(page, 'Step').click();
	await expect(stateOf(page)).toHaveText('Paused at line 2 · Reset to edit');
	await expect(callOf(page, 'paint_side · Ln 2')).toHaveAttribute('aria-current', 'true');
	expect(await shownVariables(page)).toEqual(['*length=3']);

	// The main program, clicked, stays shown as the program goes on into the second call.
	await callOf(page, 'main program · Ln 9').click();
	expect(await shownVariables(page)).toEqual(['sides=4']);
	for (let steps = 0; steps < 4; steps += 1) await control(page, 'Step').click();
	await expect(callOf(page, 'paint_square · Ln 6')).toBeVisible();
	await expect(callOf(page, 'main program · Ln 9')).toHaveAttribute('aria-current', 'true');
	expect(await shownVariables(page)).toEqual(['sides=4']);

	// Reset puts the map back: nothing to show until the program starts again.
	await control(page, 'Reset').click();
	await expect(panelOf(page, 'Variables')).toContainText('Pause the program to see its variables.');
});

test('An error brings the console forward, with a dot on the tab of the variables', async ({
	page
}) => {
	await writeCode(page, 'function divide(n):\n    print(1 / n)\n\nlet n = 0\ndivide(n)\n');
	await control(page, 'Step').click();
	await expect(panelOf(page, 'Variables')).toBeVisible();

	await page.keyboard.press('ControlOrMeta+Enter');
	await expect(stateOf(page)).toHaveText('Error at line 2');
	await expect(panelOf(page, 'Console')).toContainText('The program divided by zero.');
	await expect(variablesDot(page)).toHaveCount(1);

	// The state at the error, once the tab is opened, with the arrows of the keyboard.
	await panelTab(page, 'Console').focus();
	await page.keyboard.press('ArrowRight');
	await expect(panelTab(page, 'Variables')).toBeFocused();
	await expect(variablesDot(page)).toHaveCount(0);
	expect(await shownVariables(page)).toEqual(['n=0']);
	await expect(callOf(page, 'divide · Ln 2')).toHaveAttribute('aria-current', 'true');
});
