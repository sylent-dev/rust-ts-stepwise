import { defineConfig, devices } from '@playwright/test';

// The tests in a real browser (see Tests in a real browser in docs/technical-choices.md): the
// website as it is built, served by `vite preview` on a port of its own, in Chromium alone until
// the pass on every browser of the first release. They check the wiring of the screens, which the tests of
// Vitest can't reach without a page; the logic stays with those.
const PORT = 4180;
const ADDRESS = `http://127.0.0.1:${PORT}`;

export default defineConfig({
	testDir: 'e2e',
	// A test that fails is fixed, never run again until it passes.
	retries: 0,
	forbidOnly: Boolean(process.env.CI),
	// The CI keeps the report and the trace of a test that failed (see .github/workflows/ci.yml).
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: { baseURL: ADDRESS, trace: 'retain-on-failure' },
	projects: [
		{
			name: 'chromium',
			// The smallest window the screens are drawn for (`SMALLEST_WINDOW` in
			// src/lib/shell/window-size.ts): what doesn't fit there would show in no test larger.
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } }
		}
	],
	webServer: {
		command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
		url: ADDRESS,
		// A server already on the port would be tested in place of this build: refused.
		reuseExistingServer: false
	}
});
