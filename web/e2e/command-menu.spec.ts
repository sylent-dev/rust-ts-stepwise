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
	await expect(page.getByText('No command found with “pizza”.')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByText('No command found with “pizza”.')).toBeHidden();
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
