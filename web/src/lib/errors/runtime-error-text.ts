// What an error says once it has stopped a program while it ran (see Error handling in specs.md):
// the same two sentences as an error of the checks (error-text.ts), what happened in this program
// then the rule. The core gives it as a code with its values (crates/wasm/src/runtime_error.rs);
// its sentences are the messages of locales/en/errors.ftl, which this module names and gives
// their values.

import type {
	BinaryOperator,
	RuntimeError,
	RuntimeErrorKind,
	UnaryOperator
} from '#lib/core/core.ts';
import { type MessageArguments, t } from '#lib/i18n.ts';
import { type ErrorText, errorMessage } from './error-text.ts';

/** The code of an error while running. */
type RuntimeErrorCode = RuntimeErrorKind['code'];

/** The error of each code, with the values it carries. */
type KindOf = { [C in RuntimeErrorCode]: Extract<RuntimeErrorKind, { code: C }> };

/**
 * What an operator in front of a value does, which the message selects its words by: an operator
 * added to the core is refused here until it is placed.
 */
const UNARY_GROUPS = {
	'-': 'negate',
	not: 'not'
} satisfies Record<UnaryOperator, string>;

/**
 * What an operator between two values does, which the rule of the message selects its words by.
 * `and` and `or` stop on a side that isn't a boolean with an error of their own
 * (`logic-operand`), and are placed all the same.
 */
const BINARY_GROUPS = {
	'+': 'plus',
	'-': 'arithmetic',
	'*': 'arithmetic',
	'/': 'arithmetic',
	'%': 'arithmetic',
	'==': 'equality',
	'!=': 'equality',
	'<': 'order',
	'<=': 'order',
	'>': 'order',
	'>=': 'order',
	and: 'logic',
	or: 'logic'
} satisfies Record<BinaryOperator, string>;

/** No value: the message says what happened without a name nor a number. */
function none(): MessageArguments {
	return {};
}

/** The limit that the error passed. */
function limited({ limit }: { limit: number }): MessageArguments {
	return { limit };
}

/**
 * The values that the messages of each error take, by its code: every value the core gives, and
 * for an operator, what it does. A code added to the core is refused here until it is placed, and
 * the test of the messages then asks for its two sentences. The function that the error of too
 * many calls carries isn't given: it may not be the one that calls itself (see the backlog of
 * step 9b).
 *
 * Annotated rather than `satisfies`, as the table of the checks (error-text.ts).
 */
const VALUES: { [C in RuntimeErrorCode]: (kind: KindOf[C]) => MessageArguments } = {
	// The values a statement or an operator refuses.
	'condition-not-boolean': ({ found }) => ({ found }),
	'repeat-count-not-number': ({ found }) => ({ found }),
	'negative-repeat-count': ({ count }) => ({ count }),
	'unary-operand': ({ operator, found }) => ({ operator, group: UNARY_GROUPS[operator], found }),
	'binary-operands': ({ operator, left, right }) => ({
		operator,
		group: BINARY_GROUPS[operator],
		left,
		right
	}),
	'logic-operand': ({ operator, found }) => ({ operator, found }),
	'division-by-zero': none,
	overflow: ({ smallest, largest }) => ({ smallest, largest }),
	'text-too-long': limited,

	// The calls.
	'no-value': ({ function: name }) => ({ function: name }),
	'too-many-calls': limited,

	// What the robot can't do.
	bump: none,
	'already-carrying': none,
	'no-item-here': none,
	'not-carrying': none,
	'item-already-here': none,
	'value-not-color': ({ function: name, found }) => ({ function: name, found }),

	// What `print` can't write.
	'line-too-long': limited,

	// A mistake of the core.
	internal: none
};

/** Whether a text is the code of an error while running. */
function isRuntimeErrorCode(code: string): code is RuntimeErrorCode {
	return Object.hasOwn(VALUES, code);
}

/** Every code of an error while running, each the subject of two messages. */
export const RUNTIME_ERROR_SUBJECTS: readonly RuntimeErrorCode[] =
	Object.keys(VALUES).filter(isRuntimeErrorCode);

/** The values of the messages of an error, by the table of its code. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- `C` ties the code of the error to the function of its code, so that the table is called without `as`
function valuesOf<C extends RuntimeErrorCode>(kind: KindOf[C]): MessageArguments {
	const code: C = kind.code;
	return VALUES[code](kind);
}

/**
 * The two sentences of an error that stopped a program. Besides the values of its code, each
 * message may write the line of the error (`$line`).
 */
export function runtimeErrorText(error: RuntimeError): ErrorText {
	const values = { line: error.span.line, ...valuesOf(error.kind) };
	return {
		title: t(errorMessage(error.kind.code, 'title'), values),
		rule: t(errorMessage(error.kind.code, 'rule'), values)
	};
}
