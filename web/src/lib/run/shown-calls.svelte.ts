// What the variables panel shows of a program being played (see Variables panel in specs.md): the
// calls in progress, the one shown and its variables, read from the run as the line of the next
// step is lit. The call that the learner chose stays shown while it is in progress, even as the
// program goes on; once it has ended, the call being run is shown again. The core gives the
// variables of one call at a time: a recursion of 200 calls may hold thousands of them.

import type { Call, Run, Variable } from '#lib/core/core.ts';

/** What the panel reads of the calls shown, which only the program writes. */
export type CallsView = Pick<ShownCalls, 'calls' | 'shown' | 'variables'>;

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
	 * Reads the calls of `run` as they are now, nothing when there is no run: the call chosen while
	 * it is in progress, else the call being run. The run must not be freed.
	 */
	read(run: Run | undefined): void {
		const calls = run?.calls() ?? [];
		let shown = calls.findIndex((call) => call.number === this.#chosen);
		if (shown < 0) {
			this.#chosen = undefined;
			shown = calls.length - 1;
		}
		this.calls = calls;
		this.shown = shown < 0 ? undefined : shown;
		this.variables = run && shown >= 0 ? run.variables(shown) : [];
	}

	/**
	 * Shows the call of index `index` among `calls`, which the learner chose, from `run`: the call
	 * being run follows the program again, into the calls it makes.
	 */
	choose(index: number, run: Run | undefined): void {
		const call = this.calls[index];
		if (!call) return;
		this.#chosen = index === this.calls.length - 1 ? undefined : call.number;
		this.read(run);
	}

	/** Forgets the call chosen: the program starts again, or the map is put back. */
	forget(): void {
		this.#chosen = undefined;
	}
}
