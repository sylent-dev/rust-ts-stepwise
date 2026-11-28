// The levels in their order (see Levels and progression in specs.md): the header of a level, its
// chapter, its number and the bar of the progress; the levels opening in order, a level still
// locked opened by its address; **Previous level** and **Next level**. On the draft levels of the
// website and their order (`web/levels/chapters.toml`): the steps that design the levels replace
// them, and these tests with them.
import type { Page } from '@playwright/test';
import { codeOf, control, expect, menuName, stateOf, test, writeCode } from './test-support.ts';

/** The second draft level, a line to paint on one map, and a program that paints it. */
const RED_LINE = 'start_painting(red)\nrepeat 5:\n    forward()\n';

/**
 * Opens the level of this number by its address, at the speed **Instant**, the levels of `done`
 * done: their stable names, as the progress keeps them. Saved once, before the level opens: a
 * reload keeps what the page has saved since.
 */
async function openLevel(page: Page, number: number, done: string[] = []): Promise<void> {
	await page.goto('');
	await page.evaluate((names) => {
		localStorage.setItem('stepwise.settings', JSON.stringify({ speed: 'instant', version: 1 }));
		const levels = Object.fromEntries(names.map((name) => [name, { done: true, passed: {} }]));
		localStorage.setItem('stepwise.progress', JSON.stringify({ levels, version: 1 }));
	}, done);
	await page.goto(`levels/${String(number)}`);
}

/** A row of the menu open, by its text. */
function menuRow(page: Page, name: string) {
	return page.getByRole('menu').getByRole('menuitem', { name, exact: true });
}

test('A level names its chapter and its number in the header, whose bar fills with the levels done', async ({
	page
}) => {
	await openLevel(page, 2, ['paint-a-square']);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('A red line');
	const header = page.getByRole('banner');
	await expect(header.getByText('Paint', { exact: true })).toBeVisible();
	await expect(header.getByText('2', { exact: true })).toBeVisible();
	await expect(page.getByRole('progressbar', { name: 'Your progress' })).toHaveAttribute(
		'aria-valuetext',
		'1 of 4 levels done'
	);
	await expect(page).toHaveTitle('2. A red line · Stepwise');
});

test('A level still locked, opened by its address, names the level to play, and opens once that one is done in another tab', async ({
	page
}) => {
	await openLevel(page, 3);
	await expect(page.getByRole('heading', { name: 'This level is locked' })).toBeVisible();
	await expect(page.getByText('Finish 1. Paint a square to unlock this level.')).toBeVisible();
	await expect(page).toHaveTitle('This level is locked · Stepwise');
	await expect(page.getByRole('link', { name: 'All levels' })).toHaveAttribute('href', /\/$/);

	const other = await page.context().newPage();
	await other.goto('');
	await other.evaluate(() => {
		const done = { done: true, passed: {} };
		localStorage.setItem(
			'stepwise.progress',
			JSON.stringify({ levels: { 'paint-a-square': done, 'a-red-line': done }, version: 1 })
		);
	});
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Two squares');
	await expect(codeOf(page)).toBeVisible();
});

test('Next level, greyed until the level is done, opens the next one with the keyboard in its code; Previous level goes back', async ({
	page
}) => {
	await openLevel(page, 2, ['paint-a-square']);
	await expect(codeOf(page)).toBeVisible();
	await menuName(page, 'Level').click();
	await expect(menuRow(page, 'Next level')).toHaveAttribute('aria-disabled', 'true');
	await expect(menuRow(page, 'Previous level')).not.toHaveAttribute('aria-disabled', 'true');
	await page.keyboard.press('Escape');

	await writeCode(page, RED_LINE);
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Ended · level done');
	await menuName(page, 'Level').click();
	await menuRow(page, 'Next level').click();
	await expect(page).toHaveURL(/\/levels\/3$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Two squares');
	await expect(codeOf(page)).toBeFocused();
	await expect(codeOf(page)).toContainText('Paint two red squares');
	await expect(stateOf(page)).toHaveText('Ready');
	// The commands of the screen and the command menu follow the editor of the new level.
	await page.keyboard.press('Control+Space');
	await expect(page.getByRole('listbox', { name: 'Commands' })).toBeVisible();
	await page.keyboard.press('Escape');
	await page.keyboard.type('x');
	await expect(codeOf(page)).toContainText('x#');
	await page.keyboard.press('ControlOrMeta+z');
	await expect(codeOf(page)).not.toContainText('x#');

	await menuName(page, 'Level').click();
	await expect(menuRow(page, 'Next level')).toHaveAttribute('aria-disabled', 'true');
	await menuRow(page, 'Previous level').click();
	await expect(page).toHaveURL(/\/levels\/2$/);
	await expect(codeOf(page)).toContainText(RED_LINE.split('\n')[0] ?? '');
});

test('Previous level is greyed on the first level, and Next level on the last one', async ({
	page
}) => {
	await openLevel(page, 1);
	await expect(codeOf(page)).toBeVisible();
	await menuName(page, 'Level').click();
	await expect(menuRow(page, 'Previous level')).toHaveAttribute('aria-disabled', 'true');

	await openLevel(page, 4, ['paint-a-square', 'a-red-line', 'two-squares', 'the-staircase']);
	await expect(codeOf(page)).toBeVisible();
	await menuName(page, 'Level').click();
	await expect(menuRow(page, 'Next level')).toHaveAttribute('aria-disabled', 'true');
	await expect(menuRow(page, 'Previous level')).not.toHaveAttribute('aria-disabled', 'true');
});
