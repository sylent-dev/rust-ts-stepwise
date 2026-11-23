// The keyboard on the level screen (see Code editor and Level screen in specs.md): the way out of
// the code that the panel of the shortcuts gives, and a key held down on a row of a menu.
import { expect, test } from '@playwright/test';
import {
	codeOf,
	codeText,
	control,
	holdKey,
	menuName,
	openSandbox,
	writeCode
} from './test-support.ts';

test.beforeEach(async ({ page }) => {
	await openSandbox(page);
});

test('Escape, then Tab, leaves the code, as the panel of the shortcuts says', async ({ page }) => {
	await writeCode(page, 'forward()\n');
	await menuName(page, 'Help').click();
	await page.getByRole('menuitem', { name: 'Keyboard shortcuts' }).click();
	const panel = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
	const way = panel.locator('dl > div').filter({
		has: page.getByRole('term').filter({ hasText: 'Leave the editor' })
	});
	await expect(way.getByRole('definition')).toHaveText('Esc, then Tab');
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await expect(codeOf(page)).toBeFocused();

	// Tab alone belongs to the code: it indents, and the keyboard stays there.
	await page.keyboard.press('Tab');
	await expect(codeOf(page)).toBeFocused();
	const indented = await codeText(page);
	expect(indented).toBe('forward()\n    ');

	await page.keyboard.press('Escape');
	await page.keyboard.press('Tab');
	await expect(control(page, 'Run')).toBeFocused();
	expect(await codeText(page)).toBe(indented);
});

test('A speed taken with Enter held down types nothing in the code', async ({ page }) => {
	await writeCode(page, 'forward()\nforward()\n');
	await page.locator('.cm-line').first().click();
	const before = await codeText(page);

	await menuName(page, 'Run').click();
	// The last row of the menu, Speed, then its speeds on the one in use, then the next one.
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('menuitemradio', { name: '2 steps per second' })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await holdKey(page, 'Enter');

	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(page.getByRole('button', { name: '5 steps per second' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(codeOf(page)).toBeFocused();
	expect(await codeText(page)).toBe(before);
});
