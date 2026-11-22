// The pace of a run: how many steps of the program run at each animation frame, at each speed
// (see Execution in docs/technical-choices.md). Plain arithmetic, which knows neither the core
// nor the clock: playback.svelte.ts gives it the time of each frame and runs the steps it counts.

/** The five speeds, in steps per second; the last one, **Instant**, runs without animation. */
export const SPEEDS = [1, 2, 5, 20, Infinity] as const;

/** The speed of a first visit, the normal speed, in steps per second. */
export const NORMAL_SPEED = 2;

/** Whether a speed is **Instant**: as many steps as the browser allows, without animation. */
export function isInstant(speed: number): boolean {
	return !Number.isFinite(speed);
}

/**
 * The speed of the list nearest to a rate, in steps per second: what a speed chosen under
 * another list becomes, so that a change of the list keeps the choice of the learner as closely
 * as it can. Nearest by the ratio of the two, as a speed is felt: 3 is nearer to 2 than to 5,
 * and half-way the slower one is taken. A rate that isn't **Instant** never becomes it, however
 * fast: only **Instant** runs without animation. Nothing for what is no rate at all (zero,
 * less, not a number).
 */
export function nearestSpeed(rate: number): number | undefined {
	if (!(rate > 0)) return undefined;
	if (isInstant(rate)) return Infinity;
	const apart = (speed: number) => Math.abs(Math.log(speed / rate));
	return SPEEDS.filter((speed) => !isInstant(speed)).reduce<number | undefined>(
		(nearest, speed) => (nearest === undefined || apart(speed) < apart(nearest) ? speed : nearest),
		undefined
	);
}

/**
 * The share of a step owed at an animated speed, carried from a frame to the next. A run starts
 * with a whole step owed, so that its first step runs at its first frame.
 */
export const START_CARRY = 1;

/**
 * At an animated speed, whether a step runs at this frame, `elapsed` milliseconds after the one
 * before, and the share of a step still owed after it, kept so that the speed is exact whatever
 * the rate of the screen. At most one step runs per frame, so that each one is drawn, and a frame
 * adds at most a whole step: after a frame that came late (a tab hidden, a busy browser), the
 * program goes on at its pace rather than catching up.
 */
export function paceFrame(
	rate: number,
	elapsed: number,
	carry: number
): { step: boolean; carry: number } {
	const owed = carry + Math.min((Math.max(elapsed, 0) * rate) / 1000, 1);
	return owed >= 1 ? { step: true, carry: owed - 1 } : { step: false, carry: owed };
}

/**
 * The steps an **Instant** frame runs between two looks at the clock, which costs a little. A
 * batch can run past the budget when the steps are slow, by the time of one batch at most, the
 * clock being read before each. Measured at step 10d with the real interpreter, in Node.js 24,
 * the line printed and the next line read after each step: a batch takes 0.03 to 0.1 ms for a
 * usual program, 0.6 ms when each line prints twenty values, and up to 9 ms for lines nobody
 * writes by hand (190 values printed, a hundred texts joined on one line). The page then draws
 * one frame in two at worst and still answers: the batch stays as it is.
 *
 * A prime number, so that a loop without end is seen running: a frame stops on a whole number
 * of batches, and with a round one (1,000 until step 17b) every frame stopped on the same step
 * of any loop whose turn takes 2, 4, 5, 8 or 10 steps, the robot never seen moving while it
 * turned thousands of times (measured by the review of the animations of step 17b). With a
 * prime, where a frame stops in the loop follows the number of its batches, which the clock
 * makes different from a frame to the next. Nothing guarantees it by construction: if every
 * frame ran the same number of batches, a loop whose turn divides that number of steps would
 * be seen still again. It is the clock of a real browser, which varies from a frame to the
 * next, that makes two frames stop on different steps of a loop (see Execution in
 * docs/technical-choices.md).
 */
export const BATCH = 997;

/**
 * At **Instant**, runs steps until `budget` milliseconds have passed since `start`, so that the
 * page keeps drawing and answering between two frames, or until `step` returns `false` (the
 * program ended at that step). Returns the number of steps run, the last one included.
 */
export function runInstant(
	step: () => boolean,
	start: number,
	budget: number,
	now: () => number
): number {
	let count = 0;
	while (now() - start < budget) {
		for (let index = 0; index < BATCH; index += 1) {
			count += 1;
			if (!step()) {
				return count;
			}
		}
	}
	return count;
}
