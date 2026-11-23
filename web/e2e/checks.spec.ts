// The checks as the learner types (see Code editor in specs.md): the editor waits for the
// learner to stop typing, which needs a page and its clock.
import { expect, test } from '@playwright/test';
import { codeOf, openSandbox, writeCode } from './test-support.ts';

test('A name mistyped is underlined a moment after the last key, and says why under the pointer', async ({
	page
}) => {
	await openSandbox(page);
	await writeCode(page, 'forward()\n');
	const waves = page.locator('.underline-error');
	await expect(waves).toHaveCount(0);

	// A key every 100 ms: the check waits for half a second without a key.
	await codeOf(page).pressSequentially('forwrd()', { delay: 100 });
	expect(await waves.count()).toBe(0);
	await expect(waves).toHaveText('forwrd');

	await waves.hover();
	const tip = page.locator('.underline-tip');
	await expect(tip.locator('strong')).toHaveText('No function is named forwrd.');
	await expect(tip).toContainText('A call needs a function, built in or defined above it.');
});
