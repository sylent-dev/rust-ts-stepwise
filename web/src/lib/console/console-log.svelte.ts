// What the console of a program shows (see Console in specs.md): a log of its last **Run**, never
// the state of the moment. The lines that `print` wrote, the last 1,000 of them, and the error
// that stopped the program; or the errors that the checks found, which kept it from starting.
// The log keeps them until the next **Run**: **Reset** puts the map back and leaves it. The line
// of each error and its place follow the code as the learner changes it, as the cross of the
// margin does. Without a page, so that each case is tested; the panel draws it
// (console-panel.svelte).

import type { ProgramError, RuntimeError } from '#lib/core/core.ts';
import type { CodeChange } from '#lib/editor/edits.ts';

/**
 * The most lines that the console keeps, so that a `print` in a loop that never ends never fills
 * the memory of the page: a line holds 1,000 characters at most (decided on 2026-11-23).
 */
export const KEPT_LINES = 1000;

/**
 * What the log holds: nothing before the first **Run**; the errors that the checks found, which
 * kept the program from starting; what a program wrote, and the error that stopped it, if any.
 */
export type LogKind = 'empty' | 'checked' | 'ran';

/**
 * An error that the log lists, with its place in the code as the code is now: an error of the
 * checks, which kept the program from starting, or the one that stopped it.
 */
export type ListedError = Readonly<
	({ found: 'checks'; error: ProgramError } | { found: 'run'; error: RuntimeError }) & {
		/** Its place in the code, followed as the code changes. */
		at: number;
		/** The line of that place, from 1. */
		line: number;
	}
>;

/** What the console reads of a log, which only the program writes. */
export type LogView = Pick<ConsoleLog, 'kind' | 'report' | 'lines' | 'cut' | 'errors'>;

export class ConsoleLog {
	#kind = $state<LogKind>('empty');
	#errors = $state.raw<readonly ListedError[]>([]);
	/** The number of the report shown, which each **Run**, each list of errors, each clear changes. */
	#report = $state(0);
	/**
	 * The lines written, the last ones at the end, more than are shown at times: the earliest go
	 * in batches, so that a line written costs the same however many came before. A plain array,
	 * never a signal, since thousands are written in a frame at **Instant**: `#written`, the
	 * number of lines written since the report started, tells who reads them that they changed.
	 */
	#lines: string[] = [];
	#written = $state(0);

	/** What the log holds. */
	get kind(): LogKind {
		return this.#kind;
	}

	/**
	 * The number of the report shown: what the log holds has started anew, at a **Run**, a list
	 * of errors or a clear, rather than grown.
	 */
	get report(): number {
		return this.#report;
	}

	/** The lines that `print` wrote, in order, the last `KEPT_LINES` of them. */
	readonly lines: readonly string[] = $derived(
		this.#written === 0 ? [] : this.#lines.slice(-KEPT_LINES)
	);

	/** Whether earlier lines were written, which the log no longer shows. */
	get cut(): boolean {
		return this.#written > KEPT_LINES;
	}

	/**
	 * The errors listed: those that the checks found, in the order of the code, or the one that
	 * stopped the program, after its lines.
	 */
	get errors(): readonly ListedError[] {
		return this.#errors;
	}

	/** A program starts, by **Run** or by **Step**: the log of the last one is cleared. */
	start(): void {
		this.#renew('ran');
	}

	/** The program wrote a line, a text that may be empty. */
	print(line: string): void {
		this.#lines.push(line);
		if (this.#lines.length >= 2 * KEPT_LINES) this.#lines.splice(0, KEPT_LINES);
		this.#written += 1;
	}

	/** An error stopped the program, at a place of the code as it ran. */
	fail(error: RuntimeError): void {
		this.#errors = [{ found: 'run', error, at: error.span.from, line: error.span.line }];
	}

	/**
	 * The checks found errors in the code, which kept the program from starting, or which the
	 * learner asked to see: the log lists them in place of what it held.
	 */
	list(errors: readonly ProgramError[]): void {
		this.#renew('checked');
		this.#errors = errors.map((error) => ({
			found: 'checks',
			error,
			at: error.span.from,
			line: error.span.line
		}));
	}

	/** The code that the log speaks of is gone: back to its state before any **Run**. */
	clear(): void {
		this.#renew('empty');
	}

	/** Follows a change of the code: each error listed stays at its place, on its line. */
	follow(change: CodeChange): void {
		if (this.#errors.length === 0) return;
		this.#errors = this.#errors.map((listed) => {
			const at = change.map(listed.at);
			return { ...listed, at, line: change.lineAt(at) };
		});
	}

	/** Starts a new report, which holds nothing yet. */
	#renew(kind: LogKind): void {
		this.#kind = kind;
		this.#errors = [];
		this.#lines = [];
		this.#written = 0;
		this.#report += 1;
	}
}
