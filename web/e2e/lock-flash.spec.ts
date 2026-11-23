// The status bar when the learner tries to change a locked code (see Running a program in
// specs.md): the lock hears a text pasted, cut or dropped by the events of the page, out of reach
// of the tests of Vitest.
import type { Page } from '@playwright/test';
import {
	codeOf,
	codeText,
	expect,
	expectNoFlash,
	openSandbox,
	stateOf,
	test,
	writeCode
} from './test-support.ts';

/**
 * What "at once" allows, in milliseconds: well under the hold of the reason (60 % of
 * `--duration-flash`, 960 ms), after which Ready would come back by itself. To lower with the
 * flash, or the test passes with the bug that it looks for.
 */
const AT_ONCE = 300;

/** The ways to change the code, each tried while the program runs. */
const TRIES: Record<string, (page: Page) => Promise<void>> = {
	'a key typed': async (page) => {
		await page.keyboard.type('x');
	},
	'a text pasted': async (page) => {
		await page.evaluate(() => navigator.clipboard.writeText('pasted'));
		await page.keyboard.press('ControlOrMeta+V');
	},
	'a text cut': async (page) => {
		// Selecting stays free in a locked code.
		await page.keyboard.press('ControlOrMeta+A');
		await page.keyboard.press('ControlOrMeta+X');
	},
	'a text dropped': async (page) => {
		const dropped = await page.evaluateHandle(() => {
			const data = new DataTransfer();
			data.setData('text/plain', 'dropped');
			return data;
		});
		await codeOf(page).dispatchEvent('drop', { dataTransfer: dropped });
	}
};

test('A locked code says why it refuses a change, until Reset', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await openSandbox(page);
	await writeCode(page, 'while true:\n    turn_right()\n');
	const code = await codeText(page);

	for (const [name, attempt] of Object.entries(TRIES)) {
		await test.step(name, async () => {
			// Each Run starts without a flash, the one of the run before included.
			await page.keyboard.press('ControlOrMeta+Enter');
			await expect(stateOf(page)).toHaveText('Running · Reset to edit');
			await expectNoFlash(page);

			await attempt(page);
			await expect(stateOf(page)).toHaveText('Reset the program to edit your code.');
			expect(await codeText(page)).toBe(code);

			// The reason is held for a second: Reset puts Ready in its place at once.
			await page.keyboard.press('ControlOrMeta+Shift+Enter');
			await expect(stateOf(page)).toHaveText('Ready', { timeout: AT_ONCE });
			await expectNoFlash(page, AT_ONCE);
		});
	}
});
