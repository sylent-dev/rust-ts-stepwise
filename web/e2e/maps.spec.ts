// The maps of a level and the progress (see Variants in specs.md): the tabs of the maps, the map
// shown in the address, a map passed, the level done, the goals not met. On the draft level of the
// website, level 1, a square to paint on two maps (`web/levels/paint-a-square.toml`): the steps
// that design the levels replace it, and give these tests a level of more than one map and its
// solution.
import type { Page } from '@playwright/test';
import { codeOf, control, expect, panelOf, stateOf, test, writeCode } from './test-support.ts';

/** A program that paints the square of the draft level on both its maps. */
const SQUARE =
	'start_painting(red)\nrepeat 4:\n    repeat 3:\n        forward()\n    turn_right()\n';

/**
 * Opens the draft level at the address `levels/1` followed by `search`, at the speed **Instant**,
 * so that a program ends at once.
 */
async function openLevel(page: Page, search = ''): Promise<void> {
	await page.addInitScript(() => {
		localStorage.setItem('stepwise.settings', JSON.stringify({ speed: 'instant', version: 1 }));
	});
	await page.goto(`levels/1${search}`);
	await expect(codeOf(page)).toBeVisible();
}

/** The tab of a map, by its number. */
function mapTab(page: Page, map: number) {
	return page.getByRole('tab', { name: `Map ${String(map)}` });
}

/** The numbers of the maps whose tabs are teal: the code as it is now has passed them. */
async function tealTabs(page: Page): Promise<number[]> {
	const tabs = page.getByRole('tablist', { name: 'The maps' }).getByRole('tab');
	const passed: number[] = [];
	for (const [index, tab] of (await tabs.all()).entries()) {
		if ((await tab.getAttribute('class'))?.includes('is-passed')) passed.push(index + 1);
	}
	return passed;
}

test('A tab shows its map, which the address keeps without a new entry in the history', async ({
	page
}) => {
	await openLevel(page);
	await expect(mapTab(page, 1)).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('tabpanel', { name: 'Map 1' })).toBeVisible();
	const entries = await page.evaluate(() => history.length);

	await mapTab(page, 2).click();
	await expect(mapTab(page, 2)).toHaveAttribute('aria-selected', 'true');
	await expect(page).toHaveURL(/\/levels\/1\?map=2$/);
	expect(await page.evaluate(() => history.length)).toBe(entries);

	await page.reload();
	await expect(mapTab(page, 2)).toHaveAttribute('aria-selected', 'true');

	await mapTab(page, 2).focus();
	await page.keyboard.press('ArrowLeft');
	await expect(mapTab(page, 1)).toHaveAttribute('aria-selected', 'true');
	await expect(mapTab(page, 1)).toBeFocused();
	await expect(page).toHaveURL(/\/levels\/1$/);
});

test('An address with a map that the level doesn’t have shows its first map', async ({ page }) => {
	await openLevel(page, '?map=7');
	await expect(mapTab(page, 1)).toHaveAttribute('aria-selected', 'true');
	await expect(page).toHaveURL(/\/levels\/1$/);
});

test('A map passed turns its tab teal; every map passed with the same code, the level is done', async ({
	page
}) => {
	await openLevel(page);
	await writeCode(page, SQUARE);
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Ended · map 1 passed');
	await expect(panelOf(page, 'Console')).toContainText('Map 1 passed. Try map 2.');
	expect(await tealTabs(page)).toEqual([1]);

	await mapTab(page, 2).click();
	await expect(stateOf(page)).toHaveText('Ready');
	await expect(panelOf(page, 'Console')).toContainText('Map 1 passed. Try map 2.');
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Ended · level done');
	await expect(panelOf(page, 'Console')).toContainText('Map 2 passed. Level done!');
	expect(await tealTabs(page)).toEqual([1, 2]);

	const saved = await page.evaluate(() => localStorage.getItem('stepwise.progress'));
	expect(JSON.parse(saved ?? 'null')).toEqual({
		levels: { 'paint-a-square': { done: true, passed: { 1: SQUARE, 2: SQUARE } } },
		version: 1
	});

	await page.reload();
	await expect(codeOf(page)).toBeVisible();
	await expect.poll(() => tealTabs(page)).toEqual([1, 2]);
});

test('A change of the code takes the teal away, and undoing it brings it back', async ({
	page
}) => {
	await openLevel(page);
	await writeCode(page, SQUARE);
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Ended · map 1 passed');
	expect(await tealTabs(page)).toEqual([1]);

	await codeOf(page).press('Control+End');
	await codeOf(page).press('Space');
	await expect.poll(() => tealTabs(page)).toEqual([]);
	await codeOf(page).press('Control+z');
	await expect.poll(() => tealTabs(page)).toEqual([1]);
});

test('The console says each goal not met', async ({ page }) => {
	await openLevel(page);
	await writeCode(page, 'forward()\n');
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Ended · goal not met');
	await expect(panelOf(page, 'Console')).toContainText(
		'The goal is not met: 12 cells are not red.'
	);
	expect(await tealTabs(page)).toEqual([]);
});

test('Another tab ends the program as Reset does, and the console keeps what it said', async ({
	page
}) => {
	await openLevel(page);
	await writeCode(page, 'print("Sides")\nwhile true:\n    turn_right()\n');
	await control(page, 'Run').click();
	await expect(stateOf(page)).toHaveText('Running · Reset to edit');

	await mapTab(page, 2).click();
	await expect(stateOf(page)).toHaveText('Ready');
	await expect(control(page, 'Run')).toBeVisible();
	await expect(panelOf(page, 'Console')).toContainText('Sides');
	await codeOf(page).press('Control+End');
	await codeOf(page).pressSequentially('# free');
	await expect(codeOf(page)).toContainText('# free');
});
