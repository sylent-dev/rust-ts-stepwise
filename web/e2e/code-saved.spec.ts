// The code saved in the browser and the starting code given back (see Code editor in specs.md):
// what the tests of Vitest hold of the storage, here with a page that reloads and a key that the
// learner holds down.
import {
	codeOf,
	codeText,
	expect,
	expectCode,
	holdKey,
	leanOn,
	menuName,
	openSandbox,
	test,
	writeCode
} from './test-support.ts';

test.beforeEach(async ({ page }) => {
	await openSandbox(page);
});

test('The code typed comes back after a reload', async ({ page }) => {
	await writeCode(page, 'forward()\nturn_right()\n');
	const typed = await codeText(page);

	await page.reload();
	await expect(codeOf(page)).toBeVisible();
	await expectCode(page, typed);
});

test('Restore starting code restores on a new press of Enter, and leaves nothing to undo', async ({
	page
}) => {
	const starting = await codeText(page);
	await writeCode(page, 'forward()\n');
	const typed = await codeText(page);

	// Enter held down on the row opens the confirmation, on its action, which the repeats of the
	// key never press.
	await menuName(page, 'Level').click();
	await page.keyboard.press('ArrowUp');
	await expect(page.getByRole('menuitem', { name: 'Restore starting code…' })).toBeFocused();
	await holdKey(page, 'Enter');
	const confirmation = page.getByRole('alertdialog', {
		name: 'Restore the starting code of the sandbox?'
	});
	const action = confirmation.getByRole('button', { name: 'Restore starting code' });
	await expect(action).toBeFocused();
	expect(await codeText(page)).toBe(typed);

	// A new press restores once let go: while it stays down, nothing happens.
	await leanOn(page, 'Enter');
	await expect(confirmation).toBeVisible();
	expect(await codeText(page)).toBe(typed);
	await page.keyboard.up('Enter');
	await expect(confirmation).toBeHidden();
	await expectCode(page, starting);
	await expect(codeOf(page)).toBeFocused();

	// The code that was replaced can't come back.
	await page.keyboard.press('ControlOrMeta+Z');
	expect(await codeText(page)).toBe(starting);
	await menuName(page, 'Edit').click();
	await expect(page.getByRole('menuitem', { name: /^Undo/ })).toHaveAttribute(
		'aria-disabled',
		'true'
	);
});
