// A program played on the map (see Running a program and Animations in specs.md): its steps run
// at the pace of the speed chosen, the action of each one is animated on the map, and the line
// of the next step is highlighted once that action has ended, so that a line stays lit while the
// robot does what it says. Written for the bench of step 14b; the running of step 17 takes it
// over. It knows nothing of the clock: the page calls `tick` at each animation frame.

import type { Run, World } from '#lib/core.ts';
import { actionTime, isAnimated, type Motion } from '#lib/map/motion.ts';
import { paceFrame, runInstant, SPEEDS, START_CARRY } from '#lib/pace.ts';

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
	/** The time an action takes at a speed, in steps per second: `actionTime` by default. */
	timeAt?: (rate: number) => number;
	/** The clock that an **Instant** frame reads: `performance.now` by default. */
	now?: () => number;
}

export class Playback {
	/** The world at rest, or as the step under way found it, which the map draws. */
	world: World;
	/** The step under way, which the map animates; nothing at rest. */
	motion = $state.raw<Motion>();
	/** How far the step under way has gone, from 0 to 1. */
	progress = $state(0);
	/** The line highlighted, the one of the next step; nothing once the program has stopped. */
	line = $state<number>();
	/** The number of steps run so far. */
	steps = $state(0);
	/**
	 * Whether the program runs, rather than waits for **Run** or **Step**: until its last action
	 * has ended.
	 */
	running = $state(false);
	/** The speed, in steps per second; `Infinity` for **Instant**. */
	rate = $state<number>(NORMAL_SPEED);

	readonly #start: () => Run;
	readonly #timeAt: (rate: number) => number;
	readonly #now: () => number;
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

	/** Plays the run that `start` gives, paused before its first step. */
	constructor(
		start: () => Run,
		{ timeAt = actionTime, now = () => performance.now() }: PlaybackOptions = {}
	) {
		this.#start = start;
		this.#timeAt = timeAt;
		this.#now = now;
		this.#run = start();
		this.world = $state.raw(this.#run.world());
		this.line = this.#run.line;
	}

	/** Whether the program has stopped, at its end or on an error, and its last action ended. */
	get ended(): boolean {
		return this.line === undefined;
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
	}

	/** Pauses the program before its next step: the action under way still ends. */
	pause(): void {
		this.running = false;
	}

	/**
	 * Runs one step while the program waits, its action played as at the slowest speed, so that
	 * it is seen whatever the speed. An action still under way ends at once. Once the program has
	 * ended, it puts the map back and waits on the first step, as before the program started.
	 */
	step(): void {
		if (this.running) return;
		if (this.ended) {
			this.reset();
			return;
		}
		this.#endMotion();
		this.#runStep(undefined, this.#timeAt(SLOWEST_SPEED));
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
		if (this.motion) {
			this.#motionStart ??= time;
			const progress = (time - this.#motionStart) / this.#motionTime;
			if (progress >= 1) {
				this.#endMotion();
			} else {
				this.progress = progress;
			}
		}
		if (this.running && this.#run.line !== undefined) {
			if (Number.isFinite(this.rate)) {
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
					this.#runStep(time, this.#timeAt(this.rate));
				}
			} else {
				this.#endMotion();
				this.#runInstant();
			}
			this.#last = time;
		}
		// The program runs until its last action has ended.
		if (this.running && this.#run.line === undefined && !this.motion) this.running = false;
		return this.running || this.motion !== undefined;
	}

	/** Runs a step, and animates its action when it has one and a time to show it. */
	#runStep(start: number | undefined, time: number): void {
		const event = this.#run.step();
		this.steps = this.#run.steps;
		if (isAnimated(event) && time > 0) {
			this.motion = { action: event, after: this.#run.world() };
			this.#motionStart = start;
			this.#motionTime = time;
			this.progress = 0;
		} else {
			this.#rest(event !== 'nothing' && event !== 'printed');
		}
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
	}

	/** Ends the action under way at once, the map as the step left it. */
	#endMotion(): void {
		if (!this.motion) return;
		this.world = this.motion.after;
		this.motion = undefined;
		this.progress = 0;
		this.line = this.#run.line;
	}

	/** Shows the run at rest, the world read again when the step may have changed it. */
	#rest(changed: boolean): void {
		if (changed) this.world = this.#run.world();
		this.line = this.#run.line;
		this.steps = this.#run.steps;
	}
}
