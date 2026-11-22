// The program of a level screen (see Running a program in specs.md): the code of the editor,
// checked, then played on the map shown. The commands **Run**, **Step** and **Reset** ask it
// (level-commands.ts), and the screen reads on it what its map draws and whether its code can be
// changed.

import { check } from '#lib/core/core.ts';
import type { Scene } from '#lib/map/scene.ts';
import { Playback, type PlaybackOptions, type PlaybackStatus } from '#lib/run/playback.svelte.ts';
import type { Playground } from './playground.ts';

/**
 * What the command **Run** does now, by where the program stands, and the name it takes for it:
 * one command, one button and one shortcut.
 */
export type RunAction = 'run' | 'pause' | 'resume';

/**
 * What a screen reads of its program as it is played: what the map draws, the line of the next
 * step and the steps run. It only reads: what starts and stops the program asks the `Program`,
 * which checks the code first.
 */
export type PlayedProgram = Scene & Readonly<Pick<Playback, 'line' | 'steps'>>;

/** The program of a screen, as its commands ask it. */
export interface ProgramControls {
	/** What **Run** does now. It follows the program. */
	readonly action: RunAction;
	/** Whether **Step** has something to do: not while the program runs. It follows the program. */
	readonly canStep: boolean;
	/** **Run**, **Pause** or **Resume**, as `action` says. */
	runOrPause(): void;
	/** **Step**. */
	step(): void;
	/** **Reset**. */
	reset(): void;
}

export class Program implements ProgramControls {
	/** The program as it is played, for the screen to read. It follows the program. */
	readonly played: PlayedProgram;
	readonly #playback: Playback;
	readonly #text: () => string | undefined;
	/** The code as it was last checked, which a run starts on. */
	#checked = '';

	/**
	 * The program of the map of `playground`, at rest. `text` gives the code of the editor as it
	 * is now, read when the program starts; nothing while the screen has no editor.
	 */
	constructor(playground: Playground, text: () => string | undefined, options?: PlaybackOptions) {
		this.#text = text;
		this.#playback = new Playback(
			{ world: playground.world, start: () => playground.start(this.#checked) },
			options
		);
		this.played = this.#playback;
	}

	/** Where the program stands. */
	get status(): PlaybackStatus {
		return this.#playback.status;
	}

	/**
	 * Whether the code can't be changed: its program runs or is paused, on the text that
	 * started. Once the program has stopped, at its end or on an error, the code is free again.
	 */
	get locked(): boolean {
		return this.status === 'running' || this.status === 'paused';
	}

	get action(): RunAction {
		switch (this.status) {
			case 'running':
				return 'pause';
			case 'paused':
				return 'resume';
			case 'ready':
			case 'ended':
			case 'failed':
				return 'run';
		}
	}

	get canStep(): boolean {
		return this.status !== 'running';
	}

	runOrPause(): void {
		switch (this.action) {
			case 'pause':
				this.#playback.pause();
				break;
			case 'resume':
				this.#playback.play();
				break;
			case 'run':
				if (this.#check()) this.#playback.play();
				break;
		}
	}

	step(): void {
		// A program that waits runs its next step; one that hasn't started, or has stopped, is
		// checked as for **Run**, then only starts.
		if (this.status === 'paused' || (this.canStep && this.#check())) this.#playback.step();
	}

	reset(): void {
		this.#playback.reset();
	}

	/** Pauses the program, if it runs, as **Pause** does. */
	pause(): void {
		this.#playback.pause();
	}

	/**
	 * Frees the program, once the screen is done with it: nothing may be called afterwards. It
	 * reads no signal, since the cleanup of an effect calls it (see `kept` in
	 * core/core-ready.svelte.ts).
	 */
	free(): void {
		this.#playback.free();
	}

	/**
	 * Checks the code as it is now, before the program starts on it. With an error nothing
	 * starts, and the map goes back to its start all the same: what it showed was the end of
	 * another program. The editor underlines the errors; the console lists them at step 17e.
	 */
	#check(): boolean {
		const text = this.#text();
		if (text === undefined) return false;
		if (check(text).length > 0) {
			this.#playback.reset();
			return false;
		}
		this.#checked = text;
		return true;
	}
}
