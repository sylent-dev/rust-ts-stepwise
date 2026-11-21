import comments from '@eslint-community/eslint-plugin-eslint-comments';
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
const EDITOR_IMPORTS_MORE = otherFolders(
	'editor',
	['core'],
	'`editor/` imports `core/` and the root of `src/lib` alone: the level screen imports it, and gives it what it needs of the other folders.'
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
	// The rules that read the types, for every file: what the compiler doesn't refuse and a review
	// held before (see Strictness of the interface code in docs/technical-choices.md). A rule too
	// noisy is tuned or turned off below, with its reason.
	ts.configs.strictTypeChecked,
	ts.configs.stylisticTypeChecked,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		// A comment that turns a rule off for nothing is removed with what it excused.
		linterOptions: { reportUnusedDisableDirectives: 'error' },
		plugins: { '@eslint-community/eslint-comments': comments },
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			// A number is written in a text as it is (a coordinate of the map, the number of a
			// level); anything else is turned into a text by the code that knows how.
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{
					allowNumber: true,
					allowAny: false,
					allowBoolean: false,
					allowNever: false,
					allowNullish: false,
					allowRegExp: false
				}
			],
			// A callback typed as giving nothing may call, in one line, a function that gives nothing
			// (`vi.fn(() => menu.close())`): nothing is taken for a value there.
			'@typescript-eslint/no-confusing-void-expression': [
				'error',
				{ ignoreVoidReturningFunctions: true }
			],
			// In no set of typescript-eslint. A `switch` without `default` names every value: a new
			// event or a new code of an error of the core must then be placed. A `default` says
			// that the others are handled alike, as `_` does in a `match` of the core; one that
			// stands for no value is refused, since it would take the next value without a word.
			'@typescript-eslint/switch-exhaustiveness-check': [
				'error',
				{
					considerDefaultExhaustiveForUnions: true,
					requireDefaultForNonUnion: true,
					allowDefaultCaseForExhaustiveSwitch: false
				}
			],
			// The rules below are in no set either, and the code followed them already.
			// An `as` checks nothing: what comes from outside (`localStorage`, a file) is checked
			// before it is given a type, never said to be of one.
			'@typescript-eslint/no-unsafe-type-assertion': 'error',
			// Without a function to compare, `sort` orders numbers as texts: 1, 10, 9.
			'@typescript-eslint/require-array-sort-compare': 'error',
			// `==` converts before it compares; `== null`, for `null` or `undefined`, stays.
			eqeqeq: ['error', 'always', { null: 'ignore' }],
			// An exception to a rule is one line and its reason: `eslint-disable-next-line <rule> --
			// <reason>`, never a rule turned off for a file or for the lines that follow. The same
			// in the markup of a component, held with `no-restricted-syntax` below.
			'@eslint-community/eslint-comments/require-description': 'error',
			'@eslint-community/eslint-comments/no-use': ['error', { allow: ['eslint-disable-next-line'] }]
		}
	},
	{
		files: ['**/*.svelte'],
		rules: {
			// typescript-eslint turns `no-var` and `prefer-const` on for the `.ts` files alone; the
			// rule of Svelte knows the runes (`let { title } = $props()`).
			'no-var': 'error',
			'svelte/prefer-const': 'error',
			// The handlers written in the markup (`onclick={() => menu.close()}`) reach ESLint
			// untyped: the option above doesn't see that they give nothing, hence the wider one.
			'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }]
		}
	},
	{
		// A test replaces a function by one that does nothing (a spy, a callback left unused).
		files: ['**/*.spec.ts', '**/test-support.ts'],
		rules: { '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }] }
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
				},
				// An exception to a rule written in the markup of a component, which the rules of
				// the comments don't read: one line and its reason there too.
				{
					selector:
						'SvelteHTMLComment[value=/^\\s*eslint-(?!disable-next-line\\s+\\S.*\\s--\\s+\\S)/]',
					message:
						'An exception to a rule is one line and its reason: `<!-- eslint-disable-next-line <rule> -- <reason> -->`.'
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
		// Its tests read the style sheet of the colors of the code.
		files: ['src/lib/editor/**'],
		ignores: ['**/*.spec.ts'],
		rules: refuse(LEAVES_ITS_FOLDER, GENERATED_MODULE, itsOwnFolder('editor'), EDITOR_IMPORTS_MORE)
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
