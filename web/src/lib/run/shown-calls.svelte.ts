// What the variables panel shows of a program being played (see Variables panel in specs.md): the
// calls in progress, the one shown and its variables, read from the run as the line of the next
// step is lit. The call that the learner chose stays shown while it is in progress, even as the
// program goes on; once it has ended, the call being run is shown again. The core gives the
// variables of one call at a time: a recursion of 200 calls may hold thousands of them.

import type { Call, Run, Variable } from '#lib/core/core.ts';

/** What the panel reads of the calls shown, which only the program writes. */
export type CallsView = Readonly<Pick<ShownCalls, 'calls' | 'shown' | 'variables'>>;

export class ShownCalls {
	/**
	 * The calls in progress, from the main program to the call being run; none before the program
	 * starts, nor once the map is put back. They stay as they were once it has stopped.
	 */
	calls = $state.raw<readonly Call[]>([]);
	/** The index among `calls` of the call shown; nothing while there is none. */
	shown = $state<number>();
	/** The variables of the call shown, in the order they were declared, its parameters first. */
	variables = $state.raw<readonly Variable[]>([]);
	/** The number of the call that the learner chose; nothing while the call being run is shown. */
	#chosen: number | undefined;
	/**
	 * The variables of the call being run, as the last read found them: what a click on that call
	 * shows while the action of a step plays, the core having run that step already.
	 */
	#running: readonly Variable[] = [];

	/**
	 * Reads the calls of `run` as they are now, nothing when there is no run: the call chosen while
	 * it is in progress, else the call being run, whose variables are kept too. The run must not be
	 * freed.
	 */
	read(run: Run | undefined): void {
		const calls = run?.calls() ?? [];
		const running = calls.length - 1;
		let shown = calls.findIndex((call) => call.number === this.#chosen);
		if (shown < 0) {
			this.#chosen = undefined;
			shown = running;
		}
		this.calls = calls;
		if (!run || running < 0) {
			this.shown = undefined;
			this.#running = [];
			this.variables = [];
			return;
		}
		this.shown = shown;
		this.#running = run.variables(running);
		this.variables = shown === running ? this.#running : run.variables(shown);
	}

	/**
	 * Shows the call of index `index` among `calls`, which the learner chose, from `run`: the call
	 * being run follows the program again, into the calls it makes. A click is answered at once, as
	 * the line lit finds the calls, even while the action of a step plays, `run` being a step ahead
	 * then: the list isn't read again. Such a step, an action alone on its line, writes no variable,
	 * and may end the call being run, never another one; and only the call being run holds the
	 * variables that the step before changed. So another call reads the same in `run`, at the same
	 * index, and the call being run is the one kept from the last read.
	 */
	choose(index: number, run: Run | undefined): void {
		const call = this.calls[index];
		if (!call || !run) return;
		const running = index === this.calls.length - 1;
		this.#chosen = running ? undefined : call.number;
		this.shown = index;
		this.variables = running ? this.#running : run.variables(index);
	}

	/** Forgets the call chosen: the program starts again, or the map is put back. */
	forget(): void {
		this.#chosen = undefined;
	}
}
