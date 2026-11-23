// What the status bar of a level screen says of its program (see Level screen in specs.md): its
// state in words, and the color that the bar takes for it. Without a page, so that each case is
// tested; the bar draws it (status-bar.svelte).

import type { Outcome } from '#lib/core/core.ts';
import { t } from '#lib/i18n.ts';
import type { PlaybackStatus } from '#lib/run/playback.svelte.ts';

/**
 * The color of the bar: the one of the bands; the accent while the program is paused; the error
 * color once an error has stopped it; the teal of the tabs of the maps once a map has passed. A
 * goal not met keeps the bands' own: it isn't an error of the program, and the flags of the map
 * already say it.
 */
export type StatusTone = 'band' | 'paused' | 'failed' | 'passed';

/** The state of the program as the bar writes it, and its color. */
export interface StatusState {
	readonly text: string;
	readonly tone: StatusTone;
}

/** What the bar reads of the program of the screen. */
export interface ProgramStatus {
	/** Where the program stands. */
	readonly status: PlaybackStatus;
	/** The line of the next step, or of the step under way while it ends. */
	readonly line: number | undefined;
	/** How the program stopped, once its last action has ended. */
	readonly outcome: Outcome | undefined;
}

/**
 * What the bar says of a program, on the map numbered `map` among those of its level (nothing in
 * the sandbox): `Ready` until **Run** or **Step**, and while the screen has no program yet. While
 * the program runs or is paused, the code can't be changed, which the bar says; once it has
 * ended, the map shows the end of the run, not its start, which the bar says too.
 */
export function statusState(
	program: ProgramStatus | undefined,
	map: number | undefined
): StatusState {
	if (!program) return { text: t('status-ready'), tone: 'band' };
	switch (program.status) {
		case 'ready':
			return { text: t('status-ready'), tone: 'band' };
		case 'running':
			return { text: t('status-running'), tone: 'band' };
		case 'paused':
			// A program paused always has a line: the one of its next step, or of the step under
			// way. Without it, the bar would still say that the code can't be changed.
			return {
				text:
					program.line === undefined
						? t('status-running')
						: t('status-paused', { line: program.line }),
				tone: 'paused'
			};
		case 'ended':
		case 'failed':
			return program.outcome
				? endState(program.outcome, map)
				: { text: t('status-ready'), tone: 'band' };
	}
}

/**
 * What the bar says once the program has stopped. A map passed says its number, as its tab;
 * the level done, every map passed with the same code, comes with the tabs of the maps (step 21).
 */
function endState(outcome: Outcome, map: number | undefined): StatusState {
	switch (outcome.type) {
		case 'failed':
			return { text: t('status-failed', { line: outcome.error.span.line }), tone: 'failed' };
		case 'passed':
			return {
				text: map === undefined ? t('status-ended') : t('status-map-passed', { map }),
				tone: 'passed'
			};
		case 'goals-not-met':
			return { text: t('status-goal-not-met'), tone: 'band' };
		case 'ended':
			return { text: t('status-ended'), tone: 'band' };
	}
}
