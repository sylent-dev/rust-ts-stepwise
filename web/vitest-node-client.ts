// A test environment for Vitest: Node, with the files compiled as for a browser. Svelte compiles
// a file for a server or for a browser, and takes the effects out of the first: a test of what
// lives in a component (an `$effect`, a `$derived` that follows a `$state`) needs the second,
// without a page (see vite.config.ts).

import type { Environment } from 'vitest/environments';

export default {
	name: 'node-client',
	viteEnvironment: 'client',
	setup: () => ({ teardown() {} })
} satisfies Environment;
