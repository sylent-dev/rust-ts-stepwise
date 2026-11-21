// What an error of the checks says (see An error in docs/design-system.md): two sentences, what
// happened in this program, then the rule, true of every program. The core gives an error as a
// code with its values (crates/wasm/src/check.rs), never as a sentence; its sentences are the
// messages of locales/en/errors.ftl, which this module names and gives their values.

import type { ForeignWord, ProgramError, ProgramErrorKind, Span } from '#lib/core/core.ts';
import { type MessageArguments, t } from '#lib/i18n.ts';

/** The two sentences of an error. */
export interface ErrorText {
	/** What happened in this program, written in extra-bold: `paint_side takes 1 value, not 2.` */
	readonly title: string;
	/** The rule, true of every program: `A call gives one value for each parameter…` */
	readonly rule: string;
}

/** The code of an error of the checks. */
type ErrorCode = ProgramErrorKind['code'];

/** The error of each code, with the values it carries. */
type KindOf = { [C in ErrorCode]: Extract<ProgramErrorKind, { code: C }> };

/** What the messages of an error are about: its code, or for a word of another language, the word. */
export type ErrorSubject = Exclude<ErrorCode, 'foreign-word'> | `foreign-word-${ForeignWord}`;

/** The two parts of what an error says, each a message. */
export const ERROR_PARTS = ['title', 'rule'] as const;

/** A part of what an error says. */
export type ErrorPart = (typeof ERROR_PARTS)[number];

/** The name of the message that holds a part of an error: `error-unknown-name-title`. */
export function errorMessage(subject: ErrorSubject, part: ErrorPart): string {
	return `error-${subject}-${part}`;
}

/**
 * Each word of another language has its own two sentences, which show the way of Stepwise
 * (`elif` is written `else if`): the one exception to the rule that an error suggests nothing
 * (see Names in specs.md). A word added to the core is refused here until it is placed.
 */
const FOREIGN_WORDS = {
	elif: 'foreign-word-elif',
	def: 'foreign-word-def',
	var: 'foreign-word-var',
	const: 'foreign-word-const',
	for: 'foreign-word-for',
	continue: 'foreign-word-continue',
	pass: 'foreign-word-pass',
	none: 'foreign-word-none',
	null: 'foreign-word-null'
} satisfies { [W in ForeignWord]: `foreign-word-${W}` };

/** No value: the message says what happened without a name nor a number. */
function none(): MessageArguments {
	return {};
}

/** The name that the error is about. */
function named({ name }: { name: string }): MessageArguments {
	return { name };
}

/** The line of a place that the error keeps: the line of a `let` or of a definition. */
function lineOf(span: Span): number {
	return span.line;
}

/**
 * The values that the messages of each error take, by its code: every value the core gives,
 * a place by its line. A code added to the core is refused here until it is placed, and the
 * test of the messages then asks for its two sentences.
 */
const VALUES: { [C in ErrorCode]: (kind: KindOf[C]) => MessageArguments } = {
	// The characters of the source: the lexer.
	tab: none,
	'wrong-indent': ({ found, below, above }) => ({ found, below, above }),
	'unclosed-text': none,
	'unknown-escape': ({ escape }) => ({ escape }),
	'single-quote': none,
	'number-too-large': ({ limit }) => ({ limit }),
	'name-starts-with-digit': ({ word }) => ({ word }),
	'symbol-for-keyword': ({ symbol, keyword }) => ({ symbol, keyword }),
	'unexpected-character': ({ character }) => ({ character }),

	// The order of its words: the parser.
	'expected-value': none,
	'trailing-comma': none,
	'not-after-operator': none,
	'unexpected-token': none,
	'unclosed-paren': none,
	'unmatched-paren': none,
	'assign-in-expression': none,
	'chained-comparison': none,
	'foreign-word': ({ word }) => ({ word }),
	'expected-name': none,
	'keyword-as-name': ({ keyword }) => ({ keyword }),
	'expected-equal': none,
	'unexpected-indent': none,
	'expected-colon': none,
	'after-colon': none,
	'empty-block': none,
	'comment-only-block': none,
	'else-without-if': none,
	'else-after-else': none,
	'expected-function-name': none,
	'expected-parentheses': none,
	'invalid-parameter': none,
	'expression-too-deep': ({ limit }) => ({ limit }),
	'blocks-too-deep': ({ limit }) => ({ limit }),

	// Its names and its structure: the checker.
	'break-outside-loop': none,
	'return-outside-function': none,
	'nested-function': none,
	'not-snake-case': named,
	'reserved-name': ({ word, belongsTo }) => ({ word, belongsTo }),
	'duplicate-parameter': named,
	'unknown-name': named,
	'undeclared-variable-changed': named,
	'variable-before-let': ({ name, declared }) => ({ name, declared: lineOf(declared) }),
	'variable-after-block': ({ name, declared }) => ({ name, declared: lineOf(declared) }),
	'main-variable-in-function': named,
	'already-declared': ({ name, first }) => ({ name, first: lineOf(first) }),
	'duplicate-function': ({ name, first }) => ({ name, first: lineOf(first) }),
	'name-of-function': ({ name, defined }) => ({ name, defined: lineOf(defined) }),
	'called-before-definition': ({ name, defined }) => ({ name, defined: lineOf(defined) }),
	'wrong-value-count': ({ name, expected, given }) => ({ name, expected, given }),
	'function-without-parentheses': named,
	'variable-called': named,
	'unknown-function': named,
	'expression-alone': none
};

/** Whether a text is the code of an error of the checks. */
function isErrorCode(code: string): code is ErrorCode {
	return Object.hasOwn(VALUES, code);
}

/** Every subject that an error may have, each with its two messages. */
export const ERROR_SUBJECTS: readonly ErrorSubject[] = [
	...Object.keys(VALUES)
		.filter(isErrorCode)
		.filter((code) => code !== 'foreign-word'),
	...Object.values(FOREIGN_WORDS)
];

/** What the messages of an error are about. */
function subjectOf(kind: ProgramErrorKind): ErrorSubject {
	return kind.code === 'foreign-word' ? FOREIGN_WORDS[kind.word] : kind.code;
}

/** The values of the messages of an error, by the table of its code. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- `C` ties the code of the error to the function of its code, so that the table is called without `as`
function valuesOf<C extends ErrorCode>(kind: KindOf[C]): MessageArguments {
	const code: C = kind.code;
	return VALUES[code](kind);
}

/**
 * The two sentences of an error of the checks. Besides the values of its code, each message may
 * write the line of the error (`$line`).
 */
export function errorText(error: ProgramError): ErrorText {
	const subject = subjectOf(error.kind);
	const values = { line: error.span.line, ...valuesOf(error.kind) };
	return {
		title: t(errorMessage(subject, 'title'), values),
		rule: t(errorMessage(subject, 'rule'), values)
	};
}
