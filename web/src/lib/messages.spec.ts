// The names of the messages: the ones that the code writes and the ones that the Fluent files
// define are the same, and they follow the rule written at the top of locales/en/interface.ftl.
// `t` takes any text, and a wrong name only shows itself on the screen, with a warning in the
// console: this test reads the code instead, so that no module has to check its own names.

import { FluentParser } from '@fluent/syntax';
import { describe, expect, it } from 'vitest';
import page from '../app.html?raw';
import { benchPrograms, programMessage } from './bench/bench-programs.ts';
import { createBundle, english } from './i18n.ts';
import { levels, SANDBOX, titleMessage } from './levels.ts';
import { themeMessage, THEMES } from './settings/settings.ts';
import { adviceMessage, WINDOW_ADVICES } from './shell/window-size.ts';

/**
 * The families: the messages whose names hold a name of the data. Each is known by the function
 * that builds its names, which the code calls in place of writing a name, and has its prefix,
 * which no other message uses, and its names, one per value of the data. A new family is added
 * here.
 */
const FAMILIES: Readonly<Record<string, { prefix: string; names: readonly string[] }>> = {
	titleMessage: { prefix: 'level-', names: levels.map(({ name }) => titleMessage(name)) },
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

/** What a call of `t` or of `tAround` gives as the name of its message. */
interface Call {
	/** The line of the call in its file, from 1. */
	line: number;
	/** The name, when it is written as it is: `t('settings-title')`. */
	name: string | undefined;
	/** The function called to build it, when it is: `t(themeMessage(theme))`. */
	builder: string | undefined;
}

/**
 * The calls of `t` and of `tAround` in a source. A name given another way (a variable, a
 * template, a condition) has neither `name` nor `builder`: nothing could check it.
 */
function readCalls(source: string): Call[] {
	// Not `format(`, `.t(` nor the declaration of `t` itself; then a name between quotes that is
	// the whole value, or the start of a call.
	const call = /(?<![\w$.])(?<!function )(?:t|tAround)\(\s*(?:'([^'\\]*)'\s*[,)]|(\w+)\()?/g;
	return [...source.matchAll(call)].map((match) => ({
		line: source.slice(0, match.index).split('\n').length,
		name: match[1],
		builder: match[2]
	}));
}

/** The names of the messages that the Fluent files define. */
const defined = Object.values(english).flatMap((source) =>
	new FluentParser()
		.parse(source)
		.body.flatMap((entry) => (entry.type === 'Message' ? [entry.id.name] : []))
);

const calls = Object.entries(sources).flatMap(([file, source]) =>
	readCalls(source).map((call) => ({ file, ...call }))
);

/** The names that the code writes as they are, and the ones that the page itself asks for. */
const written = new Set([
	...calls.flatMap(({ name }) => name ?? []),
	...[...page.matchAll(/%stepwise\.text\.([^%\s]*)%/g)].flatMap((match) => match[1] ?? [])
]);

describe('readCalls', () => {
	it('reads a name written as it is, on the line of the call or on the next one', () => {
		const source =
			"const a = t('app-name');\nconst b = tAround(\n\t'window-small-size',\n\t'size'\n);";
		expect(readCalls(source)).toEqual([
			{ line: 1, name: 'app-name', builder: undefined },
			{ line: 2, name: 'window-small-size', builder: undefined }
		]);
	});

	it('reads the function that builds a name', () => {
		expect(readCalls('<p>{t(themeMessage(theme), { platform })}</p>')).toEqual([
			{ line: 1, name: undefined, builder: 'themeMessage' }
		]);
	});

	it('reads neither in a name given another way', () => {
		const source =
			"t(name);\nt(`theme-${theme}`);\nt(dark ? 'theme-night' : 'theme-day');\nt('theme-' + theme);";
		expect(readCalls(source)).toEqual(
			[1, 2, 3, 4].map((line) => ({ line, name: undefined, builder: undefined }))
		);
	});

	it('leaves out what only looks like a call of `t`', () => {
		const source = "export function t(id: string) {}\nformat('a');\nlist.at(0);\ni18n.t('b');";
		expect(readCalls(source)).toEqual([]);
	});
});

describe('the Fluent files', () => {
	// The parser of the bundle skips a message it can't read without a word: the full parser
	// keeps it as `Junk`, with what went wrong.
	it.each(Object.entries(english))('%s has no syntax error', (_path, source) => {
		const junk = new FluentParser()
			.parse(source)
			.body.filter((entry) => entry.type === 'Junk')
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
});

describe('the names that the code writes', () => {
	it('are each written as they are, or built by the function of a family', () => {
		const unread = calls
			.filter(({ name, builder }) => name === undefined && !(builder && builder in FAMILIES))
			.map(({ file, line }) => `${file}:${line}`);
		expect(unread).toEqual([]);
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

describe.each(Object.entries(FAMILIES))('the family of %s', (_builder, { prefix, names }) => {
	it('has a message for each of its names, and no other message has its prefix', () => {
		expect(names.length).toBeGreaterThan(0);
		expect(defined.filter((name) => name.startsWith(prefix)).sort()).toEqual([...names].sort());
	});
});
