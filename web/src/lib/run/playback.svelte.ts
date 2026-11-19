// A program played on the map (see Running a program and Animations in specs.md): its steps run
// at the pace of the speed chosen, the action of each one is animated on the map, and the line
// of the next step is highlighted once that action has ended, so that a line stays lit while the
// robot does what it says; then the robot shows how the run ended. Written for the bench of step
// 14b; the running of step 17 takes it over. It knows nothing of the clock: the page calls `tick`
// at each animation frame.

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
import { paceFrame, runInstant, SPEEDS, START_CARRY } from './pace.ts';

/** The time an **Instant** frame spends running steps, so that the page still draws. */
const INSTANT_BUDGET = 8;

/** The speed of a first visit, the normal speed, in steps per second. */
export const NORMAL_SPEED = 2;

/** The slowest speed, at which **Step** plays its action, whatever the speed chosen. */
const SLOWEST_SPEED = SPEEDS[0];

/**
 * Where the program stands: waiting for its first step, running, paused between two steps, or
 * stopped at its end or on an error, its last action ended.
 */
export type PlaybackStatus = 'ready' | 'running' | 'paused' | 'ended';

export interface PlaybackOptions {
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

/** Whether the system asks for less motion, at each call; never where there is no window. */
function systemLessMotion(): () => boolean {
	const query = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
	return () => query?.matches ?? false;
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
	/** The line highlighted, the one of the next step; nothing once the program has stopped. */
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
	/** The speed, in steps per second; `Infinity` for **Instant**. */
	rate = $state<number>(NORMAL_SPEED);

	readonly #start: () => Run;
	readonly #timeAt: (action: Action, rate: number, lessMotion: boolean) => number;
	readonly #now: () => number;
	readonly #lessMotion: () => boolean;
	#run: Run;
	/** The time of the frame before, for the pace; nothing before the first frame of a run. */
	#last: number | undefined;
	/** The share of a step owed, carried from a frame to the next (see `paceFrame`). */
	#carry = START_CARRY;
	/** Whether a step due waits for the action under way to end. */
	#waiting = false;
	/** When the step under way started: nothing until the frame that draws it first. */
	#motionStart: number | undefined;
	#motionTime = 0;
	/**
	 * Whether **Run** or **Step** has started the program since the map was put back: a program
	 * without a step only ends then.
	 */
	#started = false;

	/** Plays the run that `start` gives, paused before its first step. */
	constructor(
		start: () => Run,
		{
			timeAt = actionTime,
			now = () => performance.now(),
			lessMotion = systemLessMotion()
		}: PlaybackOptions = {}
	) {
		this.#start = start;
		this.#timeAt = timeAt;
		this.#now = now;
		this.#lessMotion = lessMotion;
		this.#run = start();
		this.world = $state.raw(this.#run.world());
		this.#showLine();
	}

	/** Whether the program has stopped, at its end or on an error, and its last action ended. */
	get ended(): boolean {
		return this.outcome !== undefined;
	}

	/** Where the program stands, for the controls. */
	get status(): PlaybackStatus {
		if (this.running) return 'running';
		if (this.ended) return 'ended';
		return this.steps > 0 ? 'paused' : 'ready';
	}

	/**
	 * Runs the program, from its start once it has ended: its next step at once, or once the
	 * action under way has ended, so that a click is answered at the slowest speed too.
	 */
	play(): void {
		if (this.ended) this.reset();
		this.running = true;
		this.#last = undefined;
		this.#carry = START_CARRY;
		this.#begin();
	}

	/** Pauses the program before its next step: the action under way still ends. */
	pause(): void {
		this.running = false;
	}

	/**
	 * Runs one step while the program waits, its action played as at the slowest speed, so that
	 * it is seen whatever the speed. An action still under way ends at once, and nothing more runs
	 * when it was the last one: the end of the run plays then. Once the program has ended, it puts
	 * the map back and waits on the first step, as before the program started.
	 */
	step(): void {
		if (this.running) return;
		if (this.ended) {
			this.reset();
			return;
		}
		this.#endMotion();
		this.#begin();
		this.#runStep(undefined, SLOWEST_SPEED);
	}

	/** Ends the program and puts the map back to its start, with a new run. */
	reset(): void {
		// The new run first: the old one stays whole if it can't start.
		const run = this.#start();
		this.#run.free();
		this.#run = run;
		this.running = false;
		this.motion = undefined;
		this.#carry = START_CARRY;
		this.#waiting = false;
		this.#started = false;
		this.#rest(true);
	}

	/** Frees the run, once the page is done with it: nothing may be called afterwards. */
	free(): void {
		this.#run.free();
	}

	[Symbol.dispose](): void {
		this.free();
	}

	/**
	 * Moves the program on at the animation frame of `time`, in milliseconds: the action under
	 * way, then the steps due at the speed. Returns whether another frame is needed.
	 */
	tick(time: number): boolean {
		const instant = !Number.isFinite(this.rate);
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
		if (this.running && this.#run.line !== undefined) {
			if (!instant) {
				const elapsed = this.#last === undefined ? 0 : time - this.#last;
				const paced = paceFrame(this.rate, elapsed, this.#carry);
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
					this.#runStep(time, this.rate);
				}
			} else {
				this.#runInstant();
			}
			this.#last = time;
		}
		// The program runs until its last action has ended; the end of the run plays afterwards.
		if (this.running && this.#run.line === undefined && !this.#stepUnderWay) this.running = false;
		return this.running || this.motion !== undefined;
	}

	/** Whether the action of a step is under way, rather than the end of the run or nothing. */
	get #stepUnderWay(): boolean {
		return this.motion !== undefined && !isRunEnd(this.motion.action);
	}

	/**
	 * Runs a step, and animates its action, or the error of the robot that stopped the program,
	 * when it has one and a time to show it at `rate` steps per second.
	 */
	#runStep(start: number | undefined, rate: number): void {
		// A run that has stopped has no step left: its last action, or the error it stopped on, was
		// shown already.
		if (this.#run.line === undefined) return;
		const event = this.#run.step();
		this.steps = this.#run.steps;
		const action = this.#actionOf(event);
		const lessMotion = this.#lessMotion();
		const time = action ? this.#timeAt(action, rate, lessMotion) : 0;
		if (action && time > 0) {
			this.#animate({ action, after: this.#run.world(), lessMotion }, start, time);
		} else {
			this.#rest(event !== 'nothing' && event !== 'printed');
			this.#showEnd(start);
		}
	}

	/** Animates `motion` for `time` milliseconds from `start`, or from the frame that draws it first. */
	#animate(motion: Motion, start: number | undefined, time: number): void {
		this.motion = motion;
		this.#motionStart = start;
		this.#motionTime = time;
		this.progress = 0;
	}

	/**
	 * What the map animates of the step that gave `event`: its action, or the error of the robot
	 * that stopped the program there.
	 */
	#actionOf(event: StepEvent): Action | undefined {
		if (isAnimated(event)) return event;
		return this.#run.line === undefined ? robotFailure(this.#run.outcome()) : undefined;
	}

	/** At **Instant**, runs the steps that a frame has the time for, with no animation. */
	#runInstant(): void {
		const run = this.#run;
		const step = (): boolean => {
			run.step();
			return run.line !== undefined;
		};
		runInstant(step, this.#now(), INSTANT_BUDGET, this.#now);
		this.#rest(true);
		this.#showEnd(undefined);
	}

	/**
	 * Starts the program, once since the map was put back: a program without a step, empty or made
	 * of comments, ends at once, and the end of the run plays.
	 */
	#begin(): void {
		if (this.#started) return;
		this.#started = true;
		if (this.#run.line !== undefined) return;
		this.#showLine();
		this.#showEnd(undefined);
		// Ended, it no longer runs, from this frame on.
		this.running = false;
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
	#rest(changed: boolean): void {
		if (changed) this.world = this.#run.world();
		this.#showLine();
		this.steps = this.#run.steps;
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
		const time = this.#timeAt(end, this.running ? this.rate : SLOWEST_SPEED, lessMotion);
		if (time > 0) this.#animate({ action: end, after: this.world, lessMotion }, start, time);
	}

	/** Highlights the line of the next step, or tells how the program stopped once started. */
	#showLine(): void {
		this.line = this.#run.line;
		this.outcome = this.#started && this.line === undefined ? this.#run.outcome() : undefined;
	}
}
