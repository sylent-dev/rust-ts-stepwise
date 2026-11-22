// A program played on the map (see Running a program and Animations in specs.md): its steps run
// at the pace of the speed chosen, the action of each one is animated on the map, and the line
// of the next step is highlighted once that action has ended, so that a line stays lit while the
// robot does what it says; then the robot shows how the run ended. It asks the page for its own
// animation frames, while something moves, and reads the speed at each of them.

import type { Outcome, Run, StepEvent, World } from '#lib/core/core.ts';
import {
	actionTime,
	isAnimated,
	isRunEnd,
	robotFailure,
	runEnd,
	type Action,
	type Motion
} from '#lib/map/motion.ts';
import type { Scene } from '#lib/map/scene.ts';
import { isInstant, NORMAL_SPEED, paceFrame, runInstant, SPEEDS, START_CARRY } from './pace.ts';

/** The time an **Instant** frame spends running steps, so that the page still draws. */
const INSTANT_BUDGET = 8;

/** The slowest speed, at which **Step** plays its action, whatever the speed chosen. */
const SLOWEST_SPEED = SPEEDS[0];

/**
 * Where the program stands. `ready`: nothing has started since the map was put back. `running`.
 * `paused`: between two steps, the first one included. Then, once its last action has ended,
 * `ended`: it ran to its end, without error, its goals met or not; or `failed`: an error stopped
 * it. The code can be changed in every state but `running` and `paused`.
 */
export type PlaybackStatus = 'ready' | 'running' | 'paused' | 'ended' | 'failed';

/** What a `Playback` plays: a map, and the program to run on it. */
export interface PlaybackSource {
	/** The world before any step: what the map shows at rest, the program valid or not. */
	readonly world: World;
	/**
	 * Starts a run of the program as it is now, paused before its first line. The screen checks
	 * the program before it asks for **Run** or **Step**: a program with errors throws.
	 */
	start(): Run;
}

/**
 * Asks the page for one animation frame, which calls `frame` with its time, in milliseconds;
 * returns what takes the request back.
 */
export type Frames = (frame: (time: number) => void) => () => void;

export interface PlaybackOptions {
	/**
	 * The speed, in steps per second, `Infinity` for **Instant**: read at each frame, so that it
	 * follows the setting while the program runs. The normal speed by default.
	 */
	rate?: () => number;
	/** The frames of the page: `requestAnimationFrame` by default. A test gives its own. */
	frames?: Frames;
	/**
	 * Told each line that the program prints, a text that may be empty, as its step runs: in
	 * order, and at **Instant** too, where a frame runs thousands of steps.
	 */
	onPrinted?: (line: string) => void;
	/**
	 * Told that a step threw, at a frame or at a **Step**, with what it threw. A step never
	 * throws: the errors of a program are its outcome, so this is an error of the bridge, or of
	 * what reads a step here, which the screen can only say. The program no longer runs by then,
	 * and the error goes on to who asked for the step, or to the browser, which writes it. What
	 * it shows may be a step behind its run, whose step ran before it threw, and nothing reads the
	 * run again, which may throw once more: the program is to leave, not to resume.
	 */
	onBroken?: (error: unknown) => void;
	/**
	 * The time an action takes at a speed, in steps per second, with full motion or less of it:
	 * `actionTime` by default.
	 */
	timeAt?: (action: Action, rate: number, lessMotion: boolean) => number;
	/** The clock that an **Instant** frame reads: `performance.now` by default. */
	now?: () => number;
	/**
	 * Whether the learner asks their system for less motion, read as each step starts: the
	 * setting of the system by default (`prefers-reduced-motion`).
	 */
	lessMotion?: () => boolean;
}

/** The frames of the page. */
const pageFrames: Frames = (frame) => {
	const asked = requestAnimationFrame(frame);
	return () => {
		cancelAnimationFrame(asked);
	};
};

/** Whether the system asks for less motion, at each call; never where there is no window. */
function systemLessMotion(): () => boolean {
	// The types of a browser say that `matchMedia` is always there: it isn't where a page is built
	// ahead nor in a test, which Node runs.
	if (!('matchMedia' in globalThis)) return () => false;
	const query = matchMedia('(prefers-reduced-motion: reduce)');
	return () => query.matches;
}

/**
 * Whether a step that gave `event` may have changed the world, which is then read again from the
 * core: every event but a line without action and a line printed. Each event is named, so that a
 * new one of the core must be placed: a `switch` without `default` (see web/eslint.config.js).
 */
function changesWorld(event: StepEvent): boolean {
	switch (event) {
		case 'nothing':
		case 'printed':
			return false;
		case 'moved':
		case 'turned-left':
		case 'turned-right':
		case 'started-painting':
		case 'stopped-painting':
		case 'started-erasing':
		case 'stopped-erasing':
		case 'picked-up':
		case 'dropped':
			return true;
	}
}

export class Playback implements Scene {
	/** The world at rest, or as the step under way found it, which the map draws. */
	world: World;
	/**
	 * The step under way, which the map animates, or the end of the run after its last step;
	 * nothing at rest.
	 */
	motion = $state.raw<Motion>();
	/** How far the step under way, or the end of the run, has gone, from 0 to 1. */
	progress = $state(0);
	/**
	 * The line highlighted, the one of the next step; nothing before the program starts, nor once
	 * it has stopped.
	 */
	line = $state<number>();
	/**
	 * How the program stopped, once its last action has ended; nothing until then, nor before **Run**
	 * or **Step**, even for a program without a step.
	 */
	outcome = $state.raw<Outcome>();
	/** The number of steps run so far. */
	steps = $state(0);
	/**
	 * Whether the program runs, rather than waits for **Run** or **Step**: until its last action
	 * has ended, the end of the run playing afterwards.
	 */
	running = $state(false);

	readonly #source: PlaybackSource;
	readonly #rate: () => number;
	readonly #frames: Frames;
	readonly #onPrinted: ((line: string) => void) | undefined;
	readonly #onBroken: ((error: unknown) => void) | undefined;
	readonly #timeAt: (action: Action, rate: number, lessMotion: boolean) => number;
	readonly #now: () => number;
	readonly #lessMotion: () => boolean;
	/**
	 * The run, from the **Run** or the **Step** that starts the program to the **Reset** that puts
	 * the map back; nothing at rest, where the map shows the world of the source. A plain field,
	 * never a signal: `free` reads it, and runs in the cleanup of an effect, where Svelte gives a
	 * signal the value it had before the changes of the batch. A run isn't a value with a past:
	 * read there, one would be freed twice, or never (see `kept` in core/core-ready.svelte.ts).
	 */
	#run: Run | undefined;
	/**
	 * Whether a run exists: what `status` follows, to tell a program paused before its first step
	 * from one that hasn't started. Written wherever `#run` is.
	 */
	#started = $state(false);
	/** Takes back the frame asked to the page; nothing while none is asked. */
	#unasked: (() => void) | undefined;
	/** The time of the frame before, for the pace; nothing before the first frame of a run. */
	#last: number | undefined;
	/** The share of a step owed, carried from a frame to the next (see `paceFrame`). */
	#carry = START_CARRY;
	/** Whether a step due waits for the action under way to end. */
	#waiting = false;
	/** When the step under way started: nothing until the frame that draws it first. */
	#motionStart: number | undefined;
	#motionTime = 0;

	/** Shows the map of `source` at rest: nothing runs before **Run** or **Step**. */
	constructor(
		source: PlaybackSource,
		{
			rate = () => NORMAL_SPEED,
			frames = pageFrames,
			onPrinted,
			onBroken,
			timeAt = actionTime,
			now = () => performance.now(),
			lessMotion = systemLessMotion()
		}: PlaybackOptions = {}
	) {
		this.#source = source;
		this.#rate = rate;
		this.#frames = frames;
		this.#onPrinted = onPrinted;
		this.#onBroken = onBroken;
		this.#timeAt = timeAt;
		this.#now = now;
		this.#lessMotion = lessMotion;
		this.world = $state.raw(source.world);
	}

	/**
	 * Whether the program has stopped, at its end or on an error, and its last action ended:
	 * `outcome` says how.
	 */
	get stopped(): boolean {
		return this.outcome !== undefined;
	}

	/** Where the program stands, for the controls and the status bar. */
	get status(): PlaybackStatus {
		if (this.running) return 'running';
		if (this.outcome) return this.outcome.type === 'failed' ? 'failed' : 'ended';
		return this.#started ? 'paused' : 'ready';
	}

	/**
	 * Runs the program: from its start, on the map put back, when it hasn't started or has
	 * stopped; else its next step at once, or once the action under way has ended, so that a click
	 * is answered at the slowest speed too.
	 */
	play(): void {
		const starts = !this.#run || this.stopped;
		if (starts) this.#start();
		this.running = true;
		this.#last = undefined;
		this.#carry = START_CARRY;
		if (starts) this.#endWithoutStep();
		this.#wake();
	}

	/** Pauses the program before its next step: the action under way still ends. */
	pause(): void {
		this.running = false;
	}

	/**
	 * Runs one step while the program waits, its action played as at the slowest speed, so that
	 * it is seen whatever the speed. An action still under way ends at once, and nothing more runs
	 * when it was the last one: the end of the run plays then. When the program hasn't started or
	 * has stopped, it only starts it, on the map put back, paused before its first step: each line
	 * is seen highlighted before it runs, the first one as the others.
	 */
	step(): void {
		if (this.running) return;
		if (!this.#run || this.stopped) {
			this.#start();
			this.#endWithoutStep();
		} else {
			this.#guarded(() => {
				this.#endMotion();
				this.#runStep(undefined, SLOWEST_SPEED);
			});
		}
		this.#wake();
	}

	/** Ends the program and puts the map back to its start: nothing runs until **Run** or **Step**. */
	reset(): void {
		this.#sleep();
		this.#run?.free();
		this.#run = undefined;
		this.#started = false;
		this.running = false;
		this.#rewind();
	}

	/**
	 * Frees the run, once the page is done with the program: nothing may be called afterwards.
	 * It reads no signal, since the cleanup of an effect calls it.
	 */
	free(): void {
		this.#sleep();
		this.#run?.free();
		this.#run = undefined;
		this.#started = false;
	}

	[Symbol.dispose](): void {
		this.free();
	}

	/**
	 * Moves the program on at the animation frame of `time`, in milliseconds: the action under
	 * way, then the steps due at the speed. Returns whether another frame is needed. The program
	 * asks the page for its frames itself; a test calls this in their place.
	 */
	tick(time: number): boolean {
		const rate = this.#rate();
		const instant = isInstant(rate);
		// **Instant** draws no animation: while the program runs, the action under way ends at once,
		// the last one too.
		if (this.running && instant) this.#endMotion();
		if (this.motion) {
			this.#motionStart ??= time;
			const progress = (time - this.#motionStart) / this.#motionTime;
			if (progress >= 1) {
				this.#endMotion(time);
			} else {
				this.progress = progress;
			}
		}
		if (this.running && this.#stepsLeft) {
			if (!instant) {
				const elapsed = this.#last === undefined ? 0 : time - this.#last;
				const paced = paceFrame(rate, elapsed, this.#carry);
				if (!paced.step) {
					this.#carry = paced.carry;
				} else if (this.motion) {
					// A step due before the action under way has ended, after a **Step**, a
					// **Resume** or a speed made faster, waits for it: owed whole, it runs at the
					// first frame after it.
					this.#carry = START_CARRY;
					this.#waiting = true;
				} else {
					// A step that waited starts a whole step anew: the time it waited isn't owed to
					// the next one.
					this.#carry = this.#waiting ? 0 : paced.carry;
					this.#waiting = false;
					this.#runStep(time, rate);
				}
			} else {
				this.#runInstant();
			}
			this.#last = time;
		}
		// The program runs until its last action has ended; the end of the run plays afterwards.
		if (this.running && !this.#stepsLeft && !this.#stepUnderWay) this.running = false;
		return this.running || this.motion !== undefined;
	}

	/** Whether the program has a step left to run: it has started, and hasn't stopped. */
	get #stepsLeft(): boolean {
		return this.#run?.line !== undefined;
	}

	/** Whether the action of a step is under way, rather than the end of the run or nothing. */
	get #stepUnderWay(): boolean {
		return this.motion !== undefined && !isRunEnd(this.motion.action);
	}

	/** Asks the page for a frame, unless one is asked already, and for the next ones while needed. */
	#wake(): void {
		this.#unasked ??= this.#frames((time) => {
			this.#unasked = undefined;
			this.#guarded(() => {
				if (this.tick(time)) this.#wake();
			});
		});
	}

	/**
	 * Runs what may run a step, at a frame or at a **Step**: both stop the same way if it throws.
	 * No frame follows: the program stops there, rather than show as running for ever with
	 * nothing moving; the screen is told, and the error goes on.
	 */
	#guarded(move: () => void): void {
		try {
			move();
		} catch (error) {
			this.#sleep();
			this.running = false;
			this.motion = undefined;
			this.#onBroken?.(error);
			throw error;
		}
	}

	/** Takes back the frame asked: a frame must never step a run freed since it was asked. */
	#sleep(): void {
		this.#unasked?.();
		this.#unasked = undefined;
	}

	/**
	 * Starts the program on the map put back, paused before its first step: a new run, the one
	 * before freed.
	 */
	#start(): void {
		// The new run first: the program stays as it was if it can't start.
		const run = this.#source.start();
		this.#run?.free();
		this.#run = run;
		this.#started = true;
		this.#rewind();
	}

	/** Shows the map as it starts, nothing moving: before the first step, or at rest. */
	#rewind(): void {
		this.motion = undefined;
		this.progress = 0;
		this.#carry = START_CARRY;
		this.#waiting = false;
		this.world = this.#source.world;
		this.steps = 0;
		this.#showLine();
	}

	/**
	 * Once the program has just started: one without a step, empty or made of comments, has ended
	 * already. The end of the run plays, and it no longer runs, from this frame on.
	 */
	#endWithoutStep(): void {
		if (this.#stepsLeft) return;
		this.#showEnd(undefined);
		this.running = false;
	}

	/**
	 * Runs one step of the program, and gives what it showed. The one place where a step runs, at
	 * every speed: what comes out of a step beside its action is read here, so that **Instant**
	 * never loses it. A line printed today; a breakpoint and a sound come here too (steps 18 and
	 * 19).
	 */
	#advance(run: Run): StepEvent {
		const event = run.step();
		if (event === 'printed') this.#onPrinted?.(run.printed() ?? '');
		return event;
	}

	/**
	 * Runs a step, and animates its action, or the error of the robot that stopped the program,
	 * when it has one and a time to show it at `rate` steps per second.
	 */
	#runStep(start: number | undefined, rate: number): void {
		const run = this.#run;
		// A run that has stopped has no step left: its last action, or the error it stopped on, was
		// shown already.
		if (run?.line === undefined) return;
		const event = this.#advance(run);
		this.steps = run.steps;
		const action = this.#actionOf(run, event);
		const lessMotion = this.#lessMotion();
		const time = action ? this.#timeAt(action, rate, lessMotion) : 0;
		if (action && time > 0) {
			this.#animate({ action, after: run.world(), lessMotion }, start, time);
		} else {
			this.#rest(run, changesWorld(event));
			this.#showEnd(start);
		}
	}

	/**
	 * What the map animates of the step that gave `event`: its action, or the error of the robot
	 * that stopped the program there.
	 */
	#actionOf(run: Run, event: StepEvent): Action | undefined {
		if (isAnimated(event)) return event;
		return run.line === undefined ? robotFailure(run.outcome()) : undefined;
	}

	/** Animates `motion` for `time` milliseconds from `start`, or from the frame that draws it first. */
	#animate(motion: Motion, start: number | undefined, time: number): void {
		this.motion = motion;
		this.#motionStart = start;
		this.#motionTime = time;
		this.progress = 0;
	}

	/** At **Instant**, runs the steps that a frame has the time for, with no animation. */
	#runInstant(): void {
		const run = this.#run;
		if (!run) return;
		const step = (): boolean => {
			this.#advance(run);
			return run.line !== undefined;
		};
		runInstant(step, this.#now(), INSTANT_BUDGET, this.#now);
		this.#rest(run, true);
		this.#showEnd(undefined);
	}

	/**
	 * Ends the action under way at once, the map as the step left it, then plays the end of the
	 * run from `time` when it was the last step; ends the end of the run at once too.
	 */
	#endMotion(time?: number): void {
		const motion = this.motion;
		if (!motion) return;
		this.world = motion.after;
		this.motion = undefined;
		this.progress = 0;
		this.#showLine();
		if (!isRunEnd(motion.action)) this.#showEnd(time);
	}

	/** Shows the run at rest, the world read again when the step may have changed it. */
	#rest(run: Run, changed: boolean): void {
		if (changed) this.world = run.world();
		this.#showLine();
		this.steps = run.steps;
	}

	/**
	 * Once the last action has ended, plays from `start` how the run ended: its whole time while the
	 * program runs at an animated speed, as at the slowest speed after a **Step** or a pause, and
	 * nothing at **Instant**, where the map shows the end at once. The map then reads it from
	 * `outcome`. The end is no step: **Instant** chosen while it plays doesn't cut it, the program
	 * having ended already.
	 */
	#showEnd(start: number | undefined): void {
		const end = runEnd(this.outcome);
		if (!end) return;
		const lessMotion = this.#lessMotion();
		const time = this.#timeAt(end, this.running ? this.#rate() : SLOWEST_SPEED, lessMotion);
		if (time > 0) this.#animate({ action: end, after: this.world, lessMotion }, start, time);
	}

	/**
	 * Highlights the line of the next step, or tells how the program stopped; neither before it
	 * starts.
	 */
	#showLine(): void {
		const run = this.#run;
		this.line = run?.line;
		this.outcome = run && run.line === undefined ? run.outcome() : undefined;
	}
}
