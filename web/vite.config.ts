import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// The path the website is served from, given by the deployment workflow: empty at the root of a
// domain (`https://stepwise.sylent.tools/`), `/rust-ts-stepwise` at the default address of GitHub
// Pages. Never hard-coded, so that the domain can change without changing the code.
// SvelteKit refuses a value that doesn't start with `/` or ends with it.
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// GitHub Pages serves `404.html` for an address that has no page: the application
			// starts there too, and shows its own message (src/routes/+error.svelte).
			adapter: adapter({ fallback: '404.html' }),
			paths: { base }
		})
	],
	// The drawings of the world elements live with their sheet (see src/lib/elements.ts): the
	// development server only serves the files of `web/` by itself.
	server: { fs: { allow: ['../docs/mockups/world-elements/daylight'] } },
	test: {
		expect: { requireAssertions: true },
		// Each test starts with the real functions, whatever the spies of the one before.
		restoreMocks: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
