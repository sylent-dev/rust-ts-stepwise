import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

// The layout of `src/lib` (see Development in CLAUDE.md), as far as the imports tell it: what a
// file may not import, each with what to write instead. The page itself (`src/app.html`) lives
// outside `src/lib`, where no alias leads: a test reads it by its relative path.
const LEAVES_ITS_FOLDER = {
	regex: String.raw`^(?!.*/app\.html\?raw$)(\.\./|\./[^/]+/)`,
	message:
		'A relative path names a file of the same folder (`./name.ts`). Write `#lib/<folder>/<file>` for another folder; `src/lib` never imports a route.'
};
const GENERATED_MODULE = {
	regex: '^#lib/wasm/',
	message: '`core/` alone reads the module generated in `wasm/`. Import from `#lib/core/core.ts`.'
};
const ANY_FOLDER = {
	regex: '^#lib/[^/]+/',
	message: 'The root of `src/lib` holds what every folder may import: it imports no folder itself.'
};
const NOT_THE_CORE = {
	regex: '^#lib/(?!core/)[^/]+/',
	message: '`map/` imports `core/` and the root of `src/lib` alone: no screen, no run.'
};
const NOT_UNDER_THE_CORE = {
	regex: '^#lib/(?!wasm/|page/)[^/]+/',
	message: '`core/` imports the module generated in `wasm/` and `page/` alone: no screen.'
};

/**
 * The rule that refuses these imports, for the files of one entry of the configuration.
 * @param {{ regex: string; message: string }[]} patterns
 * @returns {import('eslint').Linter.RulesRecord}
 */
function refuse(...patterns) {
	return { 'no-restricted-imports': ['error', { patterns }] };
}

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	// The last entry that names a file gives it its imports refused: each one lists them all.
	{
		files: ['src/**'],
		rules: {
			...refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE),
			// An address is written one way: what follows the root of the website, as a row of a
			// menu holds it (`Path` of `$app/types`), never the name of its route.
			'no-restricted-syntax': [
				'error',
				{
					selector: "CallExpression[callee.name='resolve'] > Literal[value=/^\\//]",
					message:
						"Write an address as what follows the root of the website: `resolve('sandbox')`, `resolve('')` for the home screen."
				}
			]
		}
	},
	{
		files: ['src/lib/*'],
		ignores: ['**/*.spec.ts'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, ANY_FOLDER)
	},
	{
		files: ['src/lib/map/**'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, NOT_THE_CORE)
	},
	{
		files: ['src/lib/core/**'],
		rules: refuse(LEAVES_ITS_FOLDER, NOT_UNDER_THE_CORE)
	},
	{
		// The one module that reads the drawings of the world elements, which live with their
		// sheet in `docs/mockups/`.
		files: ['src/lib/elements.ts'],
		rules: { 'no-restricted-imports': 'off' }
	}
);
