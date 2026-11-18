// The texts of the interface, from the Fluent files of `locales/` (see docs/technical-choices.md):
// never written in the code, so that a language is added without touching it.

import { FluentBundle, FluentResource, type FluentVariable } from '@fluent/bundle';
import english from '../../locales/en.ftl?raw';

/** The values a message takes, such as `{ version: '0.1.0' }` for `{ $version }`. */
export type MessageArguments = Record<string, FluentVariable>;

/**
 * Reads a Fluent file into a bundle, with the messages it defines twice (only the first one is
 * kept). A message with a syntax error is skipped without an error, and the messages around it
 * still load: the syntax of the files is checked by the tests, with `@fluent/syntax`.
 */
export function createBundle(
	locale: string,
	source: string
): { bundle: FluentBundle; errors: Error[] } {
	// Without the invisible marks that isolate each value from the text around it: they only
	// matter when a right-to-left language mixes with a left-to-right one.
	const bundle = new FluentBundle(locale, { useIsolating: false });
	const errors = bundle.addResource(new FluentResource(source));
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

const { bundle, errors } = createBundle('en', english);
for (const error of errors) {
	console.warn(`i18n: locales/en.ftl: ${error.message}`);
}

/** The text of a message of the interface, in English for now. */
export function t(id: string, args?: MessageArguments): string {
	return formatMessage(bundle, id, args);
}

/** The text of a message of the interface on both sides of its value `value`. */
export function tAround(
	id: string,
	value: string,
	args?: MessageArguments
): [before: string, after: string] {
	return formatAround(bundle, id, value, args);
}

/** Whether the interface has a message of this name. */
export function hasMessage(id: string): boolean {
	return bundle.hasMessage(id);
}
