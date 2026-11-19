import prettier from 'eslint-config-prettier';
import fs from 'node:fs';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

// The layout of `src/lib` (see Development in CLAUDE.md), as far as ESLint reads it: what a file
// may not import, each with what to write instead. `no-restricted-imports` reads what a file
// writes itself, never what the file it imports goes on to import: the base stays free of the
// screens because each folder that it may import is held too.

/**
 * A relative path that goes up, or down into a folder, but for the files that `allowed` matches.
 * @param {string} allowed
 */
function leavesItsFolder(allowed) {
	return {
		regex: String.raw`^(?!(?:${allowed})$)(\.\./|\./[^/]+/)`,
		message:
			'A relative path names a file of the same folder (`./name.ts`). Write `#lib/<folder>/<file>` for another folder; `src/lib` never imports a route.'
	};
}

// The page itself (`src/app.html`) lives outside `src/lib`, where no alias leads: a test reads it
// by its relative path.
const LEAVES_ITS_FOLDER = leavesItsFolder(String.raw`(\.\./)+app\.html\?raw`);

// The drawings of the world elements live with their sheet, outside `web/`.
const LEAVES_BUT_FOR_A_DRAWING = leavesItsFolder(
	String.raw`\.\./\.\./\.\./docs/mockups/world-elements/daylight/[^/]+\.svg(\?raw)?`
);

const GENERATED_MODULE = {
	regex: '^#lib/wasm/',
	message:
		'`core/core.ts` alone reads the module generated in `wasm/`. Import from `#lib/core/core.ts`.'
};

const ANY_FOLDER = {
	regex: '^#lib/(?!wasm/)[^/]+/',
	message: 'The root of `src/lib` holds what every folder may import: it imports no folder itself.'
};

/**
 * Its own folder named by `#lib/`, where a relative path says that a file is a neighbor. With the
 * relative paths that stay in their folder, it leaves a sub-folder no way to import its parent: a
 * folder of `src/lib` is flat.
 * @param {string} folder
 */
function itsOwnFolder(folder) {
	return {
		regex: `^#lib/${folder}/`,
		message: `A file of \`${folder}/\` names its neighbors by a relative path (\`./name.ts\`). A folder of \`src/lib\` holds no sub-folder: a domain that grows becomes two folders.`
	};
}

/**
 * Every folder but the ones that a folder of the base may import. Itself and the generated module
 * are left to their own patterns, which say what to write instead.
 * @param {string} folder
 * @param {string[]} allowed
 * @param {string} message
 */
function otherFolders(folder, allowed, message) {
	return { regex: `^#lib/(?!(${[folder, 'wasm', ...allowed].join('|')})/)[^/]+/`, message };
}

const MAP_IMPORTS_MORE = otherFolders(
	'map',
	['core'],
	'`map/` imports `core/` and the root of `src/lib` alone: no screen, no run.'
);
const CORE_IMPORTS_MORE = otherFolders(
	'core',
	['page'],
	'`core/` imports `page/` and the root of `src/lib` alone: no screen.'
);
const PAGE_IMPORTS_MORE = otherFolders(
	'page',
	['styles'],
	'`page/` imports `styles/` and the root of `src/lib` alone: `core/` imports it, so it imports neither the core nor a screen.'
);
const STYLES_IMPORT_MORE = otherFolders(
	'styles',
	[],
	'`styles/` imports the root of `src/lib` alone: `page/` imports it, so it imports no folder.'
);

/** The folders of `src/lib`, read from the disk: a new one is held without being listed here. */
const folders = fs
	.readdirSync(path.resolve(import.meta.dirname, 'src/lib'), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name);

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
			'no-restricted-syntax': [
				'error',
				// An address is written one way: what follows the root of the website, as a row of
				// a menu holds it (`Path` of `$app/types`), never the name of its route. A selector
				// reads a name, not where it comes from: any function named `resolve` is held.
				{
					selector: "CallExpression[callee.name='resolve'] > Literal[value=/^\\//]",
					message:
						"Write an address as what follows the root of the website: `resolve('sandbox')`, `resolve('')` for the home screen."
				},
				{
					selector:
						"CallExpression[callee.name='resolve'] > TemplateLiteral > TemplateElement:first-child[value.raw=/^\\//]",
					message:
						'Write an address as what follows the root of the website: `resolve(`levels/${number}`)`.'
				},
				// The layout is checked on the imports written with `import … from` alone: a file of
				// the project is imported no other way, a package as one likes. A test that replaces
				// a module names it by a text (`vi.mock('./core.ts', …)`), not by `import()`.
				{
					selector: 'ImportExpression[source.value=/^(#lib|\\.)/]',
					message:
						'Import a file of the project with `import … from`: the layout of `src/lib` is checked on those imports alone.'
				},
				{
					selector: 'ImportExpression > TemplateLiteral',
					message:
						'Import a file of the project with `import … from`, and a package by its name between quotes: the layout of `src/lib` is checked on those imports alone.'
				},
				{
					selector: 'TSImportType[source.value=/^(#lib|\\.)/]',
					message:
						'Write `import type … from`: the layout of `src/lib` is checked on those imports alone.'
				}
			]
		}
	},
	...folders.map((folder) => ({
		files: [`src/lib/${folder}/**`],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, itsOwnFolder(folder))
	})),
	{
		// Its tests read the folders: the names of the messages are checked in all of them.
		files: ['src/lib/*'],
		ignores: ['**/*.spec.ts'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, ANY_FOLDER)
	},
	{
		// The one module that reads the drawings: the rule of the root, but for their files.
		files: ['src/lib/elements.ts'],
		rules: refuse(LEAVES_BUT_FOR_A_DRAWING, GENERATED_MODULE, ANY_FOLDER)
	},
	{
		files: ['src/lib/map/**'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, itsOwnFolder('map'), MAP_IMPORTS_MORE)
	},
	{
		files: ['src/lib/core/**'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, itsOwnFolder('core'), CORE_IMPORTS_MORE)
	},
	{
		// What reads the generated module: the bridge of the application, what loads the module
		// in a test, and the test of the glue itself.
		files: ['src/lib/core/core.ts', 'src/lib/core/test-support.ts', 'src/lib/core/core.spec.ts'],
		rules: refuse(LEAVES_ITS_FOLDER, itsOwnFolder('core'), CORE_IMPORTS_MORE)
	},
	{
		// Its tests read what the page is checked against: the settings saved, a storage in memory.
		files: ['src/lib/page/**'],
		ignores: ['**/*.spec.ts'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, itsOwnFolder('page'), PAGE_IMPORTS_MORE)
	},
	{
		files: ['src/lib/styles/**'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, itsOwnFolder('styles'), STYLES_IMPORT_MORE)
	}
);
