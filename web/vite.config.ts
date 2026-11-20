import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// The path the website is served from, given by the deployment workflow: empty at the root of a
// domain (`https://stepwise.sylent.tools/`), `/rust-ts-stepwise` at the default address of GitHub
// Pages. Never hard-coded, so that the domain can change without changing the code.
// SvelteKit refuses a value that doesn't start with `/` or ends with it.
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SvelteKit checks the value itself, and says what is wrong with it
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
	// The folders the development server may serve besides those SvelteKit allows (`src/`,
	// `node_modules/`…): the files of the levels, which a level screen loads when it opens (see
	// src/lib/levels/levels.ts), and the drawings of the world elements, which live with their
	// sheet (see src/lib/elements.ts). Without it, the address of a level file, under `/levels/`,
	// would be answered by the page of the level screen.
	server: { fs: { allow: ['levels', '../docs/mockups/world-elements/daylight'] } },
	test: {
		expect: { requireAssertions: true },
		// Each test starts with the real functions and with no call counted, whatever the one
		// before did: `restoreMocks` gives back what `vi.spyOn` replaced, and `clearMocks` empties
		// the calls of every mock, those that `vi.mock` makes for a whole file included. It is the
		// default since Vitest 5, written here since core/core-ready.svelte.spec.ts counts on it.
		restoreMocks: true,
		clearMocks: true,
		// A style sheet read as a text (`?raw`) keeps its content: Vitest empties the style sheets
		// by default, and the tests of the page check the design tokens that it carries.
		css: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				// The tests named `*.svelte.spec.ts`: what lives in a component, its effects run as
				// in a browser, without a page. Their files are compiled as for a browser (see
				// vitest-node-client.ts), and Svelte itself is the one of a browser: on a server,
				// its `flushSync` does nothing.
				extends: './vite.config.ts',
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					environment: './vitest-node-client.ts',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
