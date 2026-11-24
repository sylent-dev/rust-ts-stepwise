// The program of a level screen (see Running a program in specs.md): the code of the editor,
// checked, then played on the map shown, with its sounds (see Sounds in specs.md). The commands
// **Run**, **Step** and **Reset** ask it (level-commands.ts), and the screen reads on it what its
// map draws, whether its code can be changed, and what its console shows.

import { ConsoleLog, type LogView } from '#lib/console/console-log.svelte.ts';
import { check } from '#lib/core/core.ts';
import type { CodeChange } from '#lib/editor/edits.ts';
import type { Scene } from '#lib/map/scene.ts';
import { Playback, type PlaybackOptions, type PlaybackStatus } from '#lib/run/playback.svelte.ts';
import { actionSound, REFUSED_SOUND, stopSound, type Cue } from '#lib/sounds/run-sounds.ts';
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

/**
 * Where a program plays its sounds: the screen gives the player of the page, which plays only
 * while the setting **Sounds** is on.
 */
export interface ProgramSounds {
	/**
	 * Called at each press of the learner that moves the program on, or asks for it (**Run**,
	 * **Resume**, **Step**): a browser plays the sounds of a page only after one, and the ones of
	 * a run come at its frames.
	 */
	wake(): void;
	play(cue: Cue): void;
	/**
	 * Stops what plays, and what was to play: the map is put back. It reads no signal: `free`
	 * calls it in the cleanup of an effect (see `kept` in core/core-ready.svelte.ts).
	 */
	stop(): void;
}

/** How a screen makes its program: as a `Playback`, and the sounds it plays. */
export interface ProgramOptions extends Omit<
	PlaybackOptions,
	'onPrinted' | 'onStopped' | 'onAction'
> {
	/** Where its sounds play; none by default. */
	sounds?: ProgramSounds;
}

export class Program implements ProgramControls {
	/** The program as it is played, for the screen to read. It follows the program. */
	readonly played: PlayedProgram;
	/**
	 * What its console shows: the log of its last **Run**, which the program writes as it runs,
	 * and the errors that kept it from starting. It follows the program.
	 */
	readonly log: LogView;
	readonly #log = new ConsoleLog();
	readonly #playback: Playback;
	readonly #text: () => string | undefined;
	readonly #sounds: ProgramSounds | undefined;
	/** The code as it was last checked, which a run starts on. */
	#checked = '';

	/**
	 * The program of the map of `playground`, at rest. `text` gives the code of the editor as it
	 * is now, read when the program starts; nothing while the screen has no editor. What it
	 * prints and the error that stops it go to its log.
	 */
	constructor(
		playground: Playground,
		text: () => string | undefined,
		{ sounds, ...options }: ProgramOptions = {}
	) {
		this.#text = text;
		this.#sounds = sounds;
		this.log = this.#log;
		this.#playback = new Playback(
			{ world: playground.world, start: () => playground.start(this.#checked) },
			{
				...options,
				onPrinted: (line) => {
					this.#log.print(line);
				},
				onStopped: (outcome) => {
					if (outcome.type === 'failed') this.#log.fail(outcome.error);
					this.#play(stopSound(outcome));
				},
				onAction: (action, time, rate) => {
					this.#play(actionSound(action, time, rate));
				}
			}
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
				this.#sounds?.wake();
				this.#playback.play();
				break;
			case 'run':
				if (this.#check()) {
					this.#log.start();
					this.#playback.play();
				}
				break;
		}
	}

	step(): void {
		// A program that waits runs its next step; one that hasn't started, or has stopped, is
		// checked as for **Run**, then only starts.
		if (this.status === 'paused') {
			this.#sounds?.wake();
			this.#playback.step();
		} else if (this.canStep && this.#check()) {
			this.#log.start();
			this.#playback.step();
		}
	}

	/**
	 * **Reset**: the map goes back to its start, and the console keeps the log of the last run.
	 * What the run played stops.
	 */
	reset(): void {
		this.#playback.reset();
		this.#sounds?.stop();
	}

	/**
	 * Lists in the console the errors of the code as it is now, as **Run** would, without running:
	 * the number of errors of the status bar asks it. Nothing changes when the code has none, nor
	 * while the program runs or is paused, on a code that had none.
	 */
	listErrors(): void {
		const text = this.#text();
		if (text === undefined || this.locked) return;
		const errors = check(text);
		if (errors.length > 0) this.#log.list(errors);
	}

	/** Follows a change of the code: the errors that the console lists stay at their places. */
	follow(change: CodeChange): void {
		this.#log.follow(change);
	}

	/**
	 * Puts the program back as its level starts, once **Restore starting code…** has replaced the
	 * code: it ends as by **Reset**, and the console forgets what it said of the code that is gone.
	 */
	restore(): void {
		this.reset();
		this.#log.clear();
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
		this.#sounds?.stop();
	}

	/**
	 * Checks the code as it is now, before the program starts on it. With an error nothing
	 * starts, and the map goes back to its start all the same: what it showed was the end of
	 * another program. The editor underlines the errors, the console lists them, and the soft
	 * slide says it, so that each press that asks for a run has an answer. What the run before
	 * played stops.
	 */
	#check(): boolean {
		const text = this.#text();
		if (text === undefined) return false;
		this.#sounds?.stop();
		this.#sounds?.wake();
		const errors = check(text);
		if (errors.length > 0) {
			this.#playback.reset();
			this.#log.list(errors);
			this.#play(REFUSED_SOUND);
			return false;
		}
		this.#checked = text;
		return true;
	}

	/** Plays a sound of the program, if it has one. */
	#play(cue: Cue | undefined): void {
		if (cue) this.#sounds?.play(cue);
	}
}
