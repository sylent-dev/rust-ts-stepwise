// The texts of the interface, from the Fluent files of `locales/` (see docs/technical-choices.md):
// never written in the code, so that a language is added without touching it. The code writes the
// names of the messages, which follow the rule at the top of locales/en/interface.ftl; a test
// reads them all (messages.spec.ts).

import { FluentBundle, FluentResource, type FluentVariable } from '@fluent/bundle';

/** The values a message takes, such as `{ version: '0.1.0' }` for `{ $version }`. */
export type MessageArguments = Record<string, FluentVariable>;

/** The Fluent files of a language, the text of each by its path: one file per domain. */
export type MessageFiles = Readonly<Record<string, string>>;

/**
 * Reads the Fluent files of a language into one bundle, with the messages defined twice, in a
 * file or in two (only the first one is kept), each error starting with the path of its file. A
 * message with a syntax error is skipped without an error, and the messages around it still load:
 * the syntax of the files is checked by the tests, with `@fluent/syntax`.
 */
export function createBundle(
	locale: string,
	files: MessageFiles
): { bundle: FluentBundle; errors: Error[] } {
	// Without the invisible marks that isolate each value from the text around it: they only
	// matter when a right-to-left language mixes with a left-to-right one.
	const bundle = new FluentBundle(locale, { useIsolating: false });
	const errors = Object.entries(files).flatMap(([path, source]) =>
		bundle
			.addResource(new FluentResource(source))
			.map((error) => new Error(`${path}: ${error.message}`, { cause: error }))
	);
	return { bundle, errors };
}

/**
 * Formats a message of the bundle. A missing message, or a value it lacks, is written to the
 * console and never stops the page: the message shows its name, or the name of the value.
 */
export function formatMessage(bundle: FluentBundle, id: string, args?: MessageArguments): string {
	const message = bundle.getMessage(id);
	if (message?.value == null) {
		console.warn(`i18n: no message "${id}" in ${bundle.locales.join(', ')}`);
		return id;
	}
	const errors: Error[] = [];
	const text = bundle.formatPattern(message.value, args, errors);
	for (const error of errors) {
		console.warn(`i18n: message "${id}": ${error.message}`);
	}
	return text;
}

/** A sign that no text holds: it marks the place of a value in a message. */
const PLACE = '\uE000';

/**
 * Formats a message on both sides of one of its values, `value`, which the interface draws by
 * itself (in bold, as a link): the text before it and the text after it. Each language places
 * the value where its sentence needs it; a message without it is all before.
 */
export function formatAround(
	bundle: FluentBundle,
	id: string,
	value: string,
	args?: MessageArguments
): [before: string, after: string] {
	const text = formatMessage(bundle, id, { ...args, [value]: PLACE });
	const at = text.indexOf(PLACE);
	return at < 0 ? [text, ''] : [text.slice(0, at), text.slice(at + PLACE.length)];
}

/** The files of English, the reference language: every file of `locales/en/`. */
export const english: MessageFiles = import.meta.glob<string>('../../locales/en/*.ftl', {
	query: '?raw',
	import: 'default',
	eager: true
});

const { bundle, errors } = createBundle('en', english);
for (const error of errors) {
	console.warn(`i18n: ${error.message}`);
}

/**
 * The text of a message of the interface, in English for now. Its name is written as it is,
 * between quotes, or built by the function of its family (`themeMessage`), and `t` is always
 * called, under its own name, never renamed nor given as a value: the test of the names reads the
 * calls as they are written (messages.spec.ts).
 */
export function t(id: string, args?: MessageArguments): string {
	return formatMessage(bundle, id, args);
}

/** The text of a message of the interface on both sides of its value `value`; named as for `t`. */
export function tAround(
	id: string,
	value: string,
	args?: MessageArguments
): [before: string, after: string] {
	return formatAround(bundle, id, value, args);
}

/**
 * The text of a message whose name comes from outside the code, or nothing when the interface has
 * no such message: the page itself names its texts (src/app.html), and takes this function as it
 * is. A name of the code goes to `t`.
 */
export function findMessage(id: string): string | undefined {
	return bundle.hasMessage(id) ? formatMessage(bundle, id) : undefined;
}
