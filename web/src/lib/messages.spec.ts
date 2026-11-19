// The names of the messages: the ones that the code writes and the ones that the Fluent files
// define are the same, and they follow the rule written at the top of locales/en/interface.ftl.
// `t` takes any text, and a wrong name only shows itself on the screen, with a warning in the
// console: this test reads the code instead, so that no module has to check its own names.
//
// It reads the text of the code, not what the code means: a call is `t(` as it is written. So `t`
// is always called, under its own name, with a name that the test can read, and what is written
// another way is refused rather than left unread.

import {
	FluentParser,
	Visitor,
	type MessageReference,
	type Resource,
	type TermReference
} from '@fluent/syntax';
import { describe, expect, it } from 'vitest';
import page from '../app.html?raw';
import { benchPrograms, programMessage } from './bench/bench-programs.ts';
import { createBundle, english } from './i18n.ts';
import { LEVEL_PARTS, levelMessage, levels, SANDBOX } from './levels.ts';
import { themeMessage, THEMES } from './settings/settings.ts';
import { adviceMessage, WINDOW_ADVICES } from './shell/window-size.ts';

/**
 * The families: the messages whose names hold a name of the data. Each is known by the one
 * function that builds its names, which the code calls in place of writing a name, and has its
 * prefix, which no other message uses, and its names, one per value of the data. A new family is
 * added here.
 */
const FAMILIES: Readonly<Record<string, { prefix: string; names: readonly string[] }>> = {
	levelMessage: {
		prefix: 'level-',
		names: levels.flatMap(({ name }) => LEVEL_PARTS.map((part) => levelMessage(name, part)))
	},
	themeMessage: { prefix: 'theme-', names: THEMES.map(themeMessage) },
	adviceMessage: { prefix: 'window-advice-', names: WINDOW_ADVICES.map(adviceMessage) },
	programMessage: {
		prefix: 'bench-program-',
		// A program of the bench may play on several maps: its message is counted once.
		names: [
			...new Set(
				[...levels.map(({ name }) => name), SANDBOX]
					.flatMap(benchPrograms)
					.map(({ name }) => programMessage(name))
			)
		]
	}
};

/** The code of the application without its tests, the text of each file by its path. */
const sources = import.meta.glob<string>(['/src/**/*.{ts,svelte}', '!/src/**/*.spec.ts'], {
	query: '?raw',
	import: 'default',
	eager: true
});

/** The line of a place in a source, from 1. */
function lineAt(source: string, index: number): number {
	return source.slice(0, index).split('\n').length;
}

/** What a call of `t`, of `tAround` or of `findMessage` gives as the name of its message. */
interface Call {
	/** The line of the call in its file, from 1. */
	line: number;
	/** The name, when it is written as it is: `t('settings-title')`. */
	name: string | undefined;
	/** The function called to build it, when it is: `t(themeMessage(theme))`. */
	builder: string | undefined;
}

/**
 * The calls of `t`, of `tAround` and of `findMessage` in a source. A name given another way (a
 * variable, a template, a condition, a call that isn't the whole value) has neither `name` nor
 * `builder`: nothing could check it. A comment is read as the code is, since nothing here tells
 * one from the other: a call written in a comment names a message that exists, and counts as a
 * reading of it.
 */
function readCalls(source: string): Call[] {
	// Neither `format(` nor `i18n.t(`, unless the dots spread what `t` gives (`...t(`), nor the
	// declaration of the function; then a name between quotes, or the call of a function without
	// a call among its values, each being the whole value.
	const call =
		/(?<![\w$])(?<!(?<!\.\.)\.)(?<!function )(?:t|tAround|findMessage)\(\s*(?:(?:'([^'\\]*)'|(\w+)\([^()]*\))\s*[,)])?/g;
	return [...source.matchAll(call)].map((match) => ({
		line: lineAt(source, match.index),
		name: match[1],
		builder: match[2]
	}));
}

/**
 * The lines of a source that name `t` or `tAround` without calling it: given as a value
 * (`names.map(t)`, `const say = t`), imported under another name or with the whole module
 * (`import * as i18n`), it would be called where `readCalls` reads nothing. The clause that
 * imports it names it too, and is left out unless it renames. Only in a source that imports the
 * module of the messages: elsewhere, `t` is a time or a text, and nothing is found.
 *
 * In such a source, a comment names `t` between backticks, as the code does; written bare, as a
 * word of its sentence, it is found, like a variable or a field declared under that name.
 */
function readMentions(source: string): number[] {
	if (!/from '[^']*\/i18n(?:\.ts)?'/.test(source)) return [];
	const clause = /^[ \t]*import \{[^}]*\} from '[^']*\/i18n(?:\.ts)?';$/m;
	const code = source.replace(clause, (found) =>
		/\bas\b/.test(found) ? found : found.replace(/[^\n]/g, ' ')
	);
	// Neither the end or the start of a word (`don’t`, `--t`, `t-shirt`), nor a field (`at.t`),
	// nor a tab (`\t`), nor a name between backticks, nor a call; then the import of the module.
	const mention =
		/(?<![\w$.'’`\\-])(?:t|tAround)(?![\w$'’`(-])|\* as \w+ from '[^']*\/i18n(?:\.ts)?'/g;
	return [...code.matchAll(mention)].map((match) => lineAt(code, match.index));
}

/** The names that the messages of a Fluent file read: other messages, and terms. */
class References extends Visitor {
	readonly messages: string[] = [];
	readonly terms: string[] = [];

	override visitMessageReference(node: MessageReference): void {
		this.messages.push(node.id.name);
	}

	override visitTermReference(node: TermReference): void {
		this.terms.push(node.id.name);
	}
}

/** What the messages of a Fluent file read. Fluent only looks for them when a message shows. */
function readReferences(resource: Resource): References {
	const references = new References();
	references.visit(resource);
	return references;
}

/** The Fluent files, read whole: the bundle of the interface skips what it can't read. */
const files = Object.entries(english).map(([path, source]) => ({
	path,
	resource: new FluentParser().parse(source)
}));

const entries = files.flatMap(({ resource }) => resource.body);

/** The names of the messages that the Fluent files define. */
const defined = entries.flatMap((entry) => (entry.type === 'Message' ? [entry.id.name] : []));

/** The names of the terms that the Fluent files define, without their dash. */
const terms = entries.flatMap((entry) => (entry.type === 'Term' ? [entry.id.name] : []));

/** The names that the messages of all the files read, in their own file or in another. */
const references = files.map(({ resource }) => readReferences(resource));
const readMessages = references.flatMap((read) => read.messages);
const readTerms = references.flatMap((read) => read.terms);

const calls = Object.entries(sources).flatMap(([file, source]) =>
	readCalls(source).map((call) => ({ file, ...call }))
);

/** The names that the code writes as they are, and the ones that the page itself asks for. */
const written = new Set([
	...calls.flatMap(({ name }) => name ?? []),
	...[...page.matchAll(/%stepwise\.text\.([^%\s]*)%/g)].flatMap((match) => match[1] ?? [])
]);

describe('readCalls', () => {
	const unread = (lines: number[]) =>
		lines.map((line) => ({ line, name: undefined, builder: undefined }));

	it('reads a name written as it is, on the line of the call or on the next one', () => {
		const source =
			"const a = t('app-name');\nconst b = tAround(\n\t'window-small-size',\n\t'size'\n);";
		expect(readCalls(source)).toEqual([
			{ line: 1, name: 'app-name', builder: undefined },
			{ line: 2, name: 'window-small-size', builder: undefined }
		]);
	});

	it('reads the function that builds a name, with its values', () => {
		const source =
			"<p>{t(adviceMessage(advice), { platform })}</p>\n<h1>{t(levelMessage(name, 'title'))}</h1>";
		expect(readCalls(source)).toEqual([
			{ line: 1, name: undefined, builder: 'adviceMessage' },
			{ line: 2, name: undefined, builder: 'levelMessage' }
		]);
	});

	it('reads a call whose value is spread, and a call of `findMessage`', () => {
		const source =
			"const parts = [...tAround('window-small-size', 'size')];\nfindMessage('app-name');";
		expect(readCalls(source)).toEqual([
			{ line: 1, name: 'window-small-size', builder: undefined },
			{ line: 2, name: 'app-name', builder: undefined }
		]);
	});

	it('reads neither in a name given another way', () => {
		const source = [
			't(name);',
			't(`theme-${theme}`);',
			"t(dark ? 'theme-night' : 'theme-day');",
			"t('theme-' + theme);",
			't("app-name");',
			'findMessage(name);'
		].join('\n');
		expect(readCalls(source)).toEqual(unread([1, 2, 3, 4, 5, 6]));
	});

	it('reads no function in a call that isn’t the whole value, nor in a call within a call', () => {
		const source = "t(themeMessage(theme) + '-more');\nt(themeMessage(pick(theme)));";
		expect(readCalls(source)).toEqual(unread([1, 2]));
	});

	it('leaves out what only looks like a call of `t`', () => {
		const source = "export function t(id: string) {}\nformat('a');\nlist.at(0);\ni18n.t('b');";
		expect(readCalls(source)).toEqual([]);
	});

	// Nothing here tells a comment from the code. Taking the comments out with another expression
	// would be worse: `'../../locales/en/*.ftl'` opens one that isn't, and real calls would go.
	it('reads a call written in a comment as one of the code', () => {
		expect(readCalls("// As `t('app-name')` does.\n/** See `t(name)`. */")).toEqual([
			{ line: 1, name: 'app-name', builder: undefined },
			{ line: 2, name: undefined, builder: undefined }
		]);
	});
});

describe('readMentions', () => {
	it('finds `t` given as a value, kept under another name or imported under one', () => {
		const source = [
			"import { t as say } from '#lib/i18n.ts';",
			'const labels = names.map(t);',
			'const around = tAround;',
			'const texts = { t };'
		].join('\n');
		expect(readMentions(source)).toEqual([1, 2, 3, 4]);
	});

	it('finds the whole module imported under a name, with its extension or without it', () => {
		expect(readMentions("import * as i18n from '#lib/i18n.ts';\ni18n.t('app-name');")).toEqual([1]);
		expect(readMentions("import * as i18n from './i18n';\ni18n.t('app-name');")).toEqual([1]);
	});

	it('finds `t` after an import written over several lines, on its own line', () => {
		const source = "import {\n\tt,\n\ttAround\n} from './i18n';\nconst labels = names.map(t);";
		expect(readMentions(source)).toEqual([5]);
	});

	it('finds none where `t` is imported, then called', () => {
		const source = [
			'<script lang="ts">',
			"\timport {\n\t\tt,\n\t\ttAround\n\t} from '#lib/i18n.ts';",
			"\tconst [before, after] = tAround('window-small-size', 'size');",
			'</script>',
			"<p title={t('panel-close')}>{before}{after}</p>"
		].join('\n');
		expect(readMentions(source)).toEqual([]);
	});

	it('finds none in a word, a field, a design token, a tab or a name between backticks', () => {
		const source = [
			"import { t } from '#lib/i18n.ts';",
			"// It doesn’t, and it can't: the name comes from `t`, or from `tAround`.",
			"const at = step.t + 't';",
			'/* var(--t) */',
			"const indent = '\\t\\t'.replace(/^\\t+/, '');"
		].join('\n');
		expect(readMentions(source)).toEqual([]);
	});

	it('finds none in a source that doesn’t import the messages, where `t` is a time', () => {
		expect(readMentions('const ease = (t: number) => t * t;\nframes.map(t);')).toEqual([]);
	});
});

describe('readReferences', () => {
	it('reads the messages and the terms that a message names, in a variant too', () => {
		const resource = new FluentParser().parse(
			[
				'tab-title = { $page } · { app-name }',
				'advice =',
				'    { $platform ->',
				'        [mac] { advice-mac }, in { -brand }',
				'       *[other] Zoom out.',
				'    }'
			].join('\n')
		);
		const { messages, terms: named } = readReferences(resource);
		expect(messages).toEqual(['app-name', 'advice-mac']);
		expect(named).toEqual(['brand']);
	});
});

describe('the Fluent files', () => {
	// The parser of the bundle skips a message it can't read without a word: the full parser
	// keeps it as `Junk`, with what went wrong.
	it.each(files)('$path has no syntax error', ({ resource }) => {
		const junk = resource.body
			.filter((entry) => entry.type === 'Junk')
			.map((entry) => ({
				content: entry.content,
				errors: entry.annotations.map((a) => a.message)
			}));
		expect(junk).toEqual([]);
	});

	it('define each message once, in one file', () => {
		expect(defined.length).toBeGreaterThan(0);
		expect(createBundle('en', english).errors).toEqual([]);
	});

	it('name each message after its zone and what it is there, never with a single word', () => {
		expect(defined.filter((name) => !/^[a-z]+(-[a-z0-9]+)+$/.test(name))).toEqual([]);
	});

	// A message that reads `{ app-nam }` loads without a word, and shows `{app-nam}`.
	it('read, from a message, only messages and terms that they define', () => {
		expect(readMessages.filter((name) => !defined.includes(name))).toEqual([]);
		expect(readTerms.filter((name) => !terms.includes(name))).toEqual([]);
	});

	it('define no term that no message reads', () => {
		expect(terms.filter((name) => !readTerms.includes(name))).toEqual([]);
	});
});

describe('the names that the code writes', () => {
	it('are each written as they are, or built by the function of a family', () => {
		const unread = calls
			.filter(
				({ name, builder }) =>
					name === undefined && !(builder !== undefined && Object.hasOwn(FAMILIES, builder))
			)
			.map(({ file, line }) => `${file}:${line}`);
		expect(unread).toEqual([]);
	});

	it('are read by `t` under its own name: never renamed, never given as a value', () => {
		const named = Object.entries(sources).flatMap(([file, source]) =>
			readMentions(source).map((line) => `${file}:${line}`)
		);
		expect(named).toEqual([]);
	});

	it('each have their message', () => {
		expect(written.size).toBeGreaterThan(0);
		expect([...written].filter((name) => !defined.includes(name))).toEqual([]);
	});

	it('are never a name of a family: its function builds it', () => {
		const prefixes = Object.values(FAMILIES).map(({ prefix }) => prefix);
		expect(
			[...written].filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))
		).toEqual([]);
	});
});

describe('the messages', () => {
	it('are each read by the code, or belong to a family', () => {
		const built = Object.values(FAMILIES).flatMap(({ names }) => names);
		expect(defined.filter((name) => !written.has(name) && !built.includes(name))).toEqual([]);
	});
});

describe.each(Object.entries(FAMILIES))('the family of %s', (builder, { prefix, names }) => {
	// The messages of a family that nothing builds any more would stay, read by no one; and the
	// name of the function is a text here, which nothing else ties to the function.
	it('is built by its function, which the code calls', () => {
		expect(calls.filter((call) => call.builder === builder).length).toBeGreaterThan(0);
	});

	it('has a message for each of its names, and no other message has its prefix', () => {
		expect(names.length).toBeGreaterThan(0);
		expect(defined.filter((name) => name.startsWith(prefix)).sort()).toEqual([...names].sort());
	});
});
