// The command menu (see Command menu in specs.md): Ctrl+Space at the cursor, the letters typed in
// the code that filter it, the keys and the mouse that choose and insert, the places of a
// statement to fill in, and the menu greyed while the code is locked.
import {
	codeOf,
	control,
	expect,
	expectCode,
	menuName,
	openSandbox,
	test,
	writeCode
} from './test-support.ts';
import type { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await openSandbox(page);
});

/** The list of the words of the open menu. */
function menuList(page: Page) {
	return page.getByRole('listbox', { name: 'Commands' });
}

/** The word chosen in the open menu. */
function chosenWord(page: Page) {
	return menuList(page).getByRole('option', { selected: true });
}

test('Ctrl+Space opens the menu at the cursor; the letters typed filter it, and Enter inserts', async ({
	page
}) => {
	await writeCode(page, 'forward()\n');
	await page.keyboard.press('Control+End');
	await page.keyboard.type('pai');
	await page.keyboard.press('Control+Space');
	await expect(chosenWord(page)).toHaveText('start_painting(color)');
	await expect(menuList(page).getByRole('option')).toHaveText([
		'start_painting(color)',
		'stop_painting()',
		'is_painting()'
	]);

	await page.keyboard.type('nt');
	await page.keyboard.press('ArrowDown');
	await expect(chosenWord(page)).toHaveText('stop_painting()');
	await page.keyboard.press('Enter');

	await expect(menuList(page)).toBeHidden();
	await expectCode(page, 'forward()\nstop_painting()');
	await expect(codeOf(page)).toBeFocused();
});

test('A statement comes with its places: Enter goes from the condition to its block', async ({
	page
}) => {
	await writeCode(page, '');
	await page.keyboard.type('whi');
	await page.keyboard.press('Control+Space');
	await page.keyboard.press('Enter');
	await page.keyboard.type('front_is_clear()');
	await page.keyboard.press('Enter');
	await page.keyboard.type('forward()');

	await expectCode(page, 'while front_is_clear():\n    forward()');
});

test('The mouse chooses a category and inserts a word; nothing found shows the robot', async ({
	page
}) => {
	await writeCode(page, '');
	await page.keyboard.press('Control+Space');
	await page.getByRole('button', { name: 'Colors' }).click();
	await expect(chosenWord(page)).toHaveText('red');
	await menuList(page).getByRole('option', { name: 'blue' }).click();
	await expectCode(page, 'blue');
	await expect(codeOf(page)).toBeFocused();

	await page.keyboard.type(' pizza');
	await page.keyboard.press('Control+Space');
	// What a screen reader is told, beside the robot and its sentence.
	const nothing = page.getByRole('status').filter({ hasText: 'No command found with “pizza”.' });
	await expect(nothing).toHaveCount(1);
	await page.keyboard.press('Escape');
	await expect(nothing).toHaveCount(0);
	await expectCode(page, 'blue pizza');
});

test('Edit › Commands opens the menu in the code, and is greyed while the program runs', async ({
	page
}) => {
	await writeCode(page, 'while true:\n    turn_left()\n');
	await menuName(page, 'Edit').click();
	await page.getByRole('menuitem', { name: /^Commands/ }).click();
	await expect(menuList(page)).toBeVisible();
	await expect(codeOf(page)).toBeFocused();
	await page.keyboard.press('Control+Space');
	await expect(menuList(page)).toBeHidden();

	await control(page, 'Run').click();
	await menuName(page, 'Edit').click();
	await expect(page.getByRole('menuitem', { name: /^Commands/ })).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await page.keyboard.press('Escape');
	await page.keyboard.press('Control+Space');
	await expect(menuList(page)).toBeHidden();
});

test('Escape closes the menu or ends the places, and Tab then leaves the code', async ({
	page
}) => {
	await writeCode(page, '');
	await page.keyboard.press('Control+Space');
	await page.keyboard.press('Escape');
	await expect(menuList(page)).toBeHidden();
	await page.keyboard.press('Tab');
	await expect(control(page, 'Run')).toBeFocused();
	await expectCode(page, '');

	await codeOf(page).click();
	await page.keyboard.type('rep');
	await page.keyboard.press('Control+Space');
	await page.keyboard.press('Enter');
	await page.keyboard.press('Escape');
	await page.keyboard.press('Tab');
	await expect(control(page, 'Run')).toBeFocused();
	await expectCode(page, 'repeat :\n    ');
});

test('The menu opens on the category chosen last, after Restore starting code too', async ({
	page
}) => {
	await writeCode(page, 'forward()\n');
	await page.keyboard.press('Control+Space');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(chosenWord(page)).toHaveText('pick_up()');
	await page.keyboard.press('Escape');

	await menuName(page, 'Level').click();
	await page.getByRole('menuitem', { name: 'Restore starting code…' }).click();
	await page
		.getByRole('alertdialog', { name: 'Restore the starting code of the sandbox?' })
		.getByRole('button', { name: 'Restore starting code' })
		.click();
	await expect(codeOf(page)).toBeFocused();
	await page.keyboard.press('Control+End');
	await page.keyboard.press('Enter');
	await page.keyboard.press('Control+Space');
	await expect(chosenWord(page)).toHaveText('pick_up()');
});

test('The menu opens over the controls in the corner of the code', async ({ page }) => {
	await writeCode(page, 'forward()\n'.repeat(13) + 'pai');
	await page.keyboard.press('Control+Space');
	const run = await control(page, 'Run').boundingBox();
	if (!run) throw new Error('The control Run isn’t drawn.');

	const onTop = await page.evaluate(
		({ x, y }) => document.elementFromPoint(x, y)?.closest('.cm-tooltip') !== null,
		{ x: run.x + run.width / 2, y: run.y + run.height / 2 }
	);
	expect(onTop).toBe(true);
});

test('Your names lists what the cursor may use, each with its line, and inserts a call', async ({
	page
}) => {
	await writeCode(page, 'let sides = 0\nfunction paint_side(length):\n    forward()\n');
	await page.keyboard.press('Control+End');
	await page.keyboard.press('Control+Space');
	await page.getByRole('button', { name: 'Your names' }).click();
	await expect(menuList(page).getByRole('option')).toHaveText(['paint_side(length)', 'sides']);
	await expect(chosenWord(page)).toHaveText('paint_side(length)');
	await expect(page.getByText('A function of your program, defined on line 2.')).toBeVisible();

	await page.keyboard.press('ArrowDown');
	await expect(page.getByText('A variable of your program, declared on line 1.')).toBeVisible();
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Enter');
	await page.keyboard.type('sid');
	await page.keyboard.press('Control+Space');
	await expect(chosenWord(page)).toHaveText('sides');
	await page.keyboard.press('Tab');

	await expectCode(
		page,
		'let sides = 0\nfunction paint_side(length):\n    forward()\npaint_side(sides)'
	);
});

test('Your names says why it has no name: none declared above, or an error above', async ({
	page
}) => {
	const said = (sentence: string) => page.getByRole('status').filter({ hasText: sentence });

	await writeCode(page, '');
	await page.keyboard.press('Control+Space');
	await page.getByRole('button', { name: 'Your names' }).click();
	await expect(
		said('Your variables and functions appear here once they are declared above the cursor.')
	).toHaveCount(1);
	await page.keyboard.press('Escape');

	await writeCode(page, 'let sides = 0\nforward(\n');
	await page.keyboard.press('Control+End');
	await page.keyboard.press('Control+Space');
	await page.getByRole('button', { name: 'Your names' }).click();
	await expect(
		said('Your variables and functions appear here once the error on line 2 is fixed.')
	).toHaveCount(1);
});
