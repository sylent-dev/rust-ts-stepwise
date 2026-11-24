// Which of the console and the variables the panels under the map show, in a window narrower than
// 1,600 pixels, where they are two tabs (see Variables panel in specs.md). **Run** shows the
// console, as does a list of the errors of the code; a pause shows the variables, unless the
// learner has chosen the console since the program started; an error brings the console forward,
// with a dot on the tab of the variables, which holds the state at that moment, until the learner
// opens it or the program starts again or goes back to its start. From 1,600 pixels wide, both
// stand side by side and the choice isn't seen. Without a page, so that each case is tested; the
// panels draw it (panels.svelte).

import type { PlaybackStatus } from '#lib/run/playback.svelte.ts';

/** The two panels under the map. */
export type PanelName = 'console' | 'variables';

export class PanelTabs {
	/** The panel shown. */
	shown = $state<PanelName>('console');
	/** Whether the tab of the variables holds the state at an error that the learner hasn't opened. */
	dot = $state(false);
	/** Whether the learner has chosen the console since the program started. */
	#consoleChosen = false;

	/** A program starts, by **Run** or by **Step** from stopped: the console shows its log. */
	started(): void {
		this.shown = 'console';
		this.#consoleChosen = false;
		this.dot = false;
	}

	/**
	 * The console lists the errors of the code: a **Run** that the checks refuse, or the number of
	 * errors of the status bar clicked. The dot stays with the state that it speaks of.
	 */
	listed(): void {
		this.shown = 'console';
	}

	/**
	 * Follows the program as where it stands changes: a pause shows the variables, an error the
	 * console, and the map put back takes the dot away. Each status is named, so that a new one
	 * must be placed: a `switch` without `default` (see web/eslint.config.js).
	 */
	follow(status: PlaybackStatus): void {
		switch (status) {
			case 'paused':
				if (!this.#consoleChosen) this.#show('variables');
				break;
			case 'failed':
				this.shown = 'console';
				this.dot = true;
				break;
			case 'ready':
				this.dot = false;
				break;
			case 'running':
			case 'ended':
				break;
		}
	}

	/** Shows the panel that the learner chose. */
	choose(panel: PanelName): void {
		if (panel === 'console') this.#consoleChosen = true;
		this.#show(panel);
	}

	/** Shows `panel`: the variables opened, the dot has been seen. */
	#show(panel: PanelName): void {
		this.shown = panel;
		if (panel === 'variables') this.dot = false;
	}
}
