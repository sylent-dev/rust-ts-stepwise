// The curves of the animations of the map: each takes the share of the time gone, from 0 to 1,
// and gives the share of the way done (see Animations in specs.md). They are those of the mock-up,
// `docs/mockups/world-elements/motion.js`.

/** Starts and stops gently: a move, so that the robot stops clearly in the middle of its cell. */
export function smooth(t: number): number {
	return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** How far a turn goes past its end, as a share of a quarter turn: 5 %, 4.5°. */
const OVERSHOOT = 0.05;

/**
 * The curve 1 + (c + 1)(t - 1)³ + c(t - 1)² goes past its end by 4c³ / 27(c + 1)²: the `c` that
 * gives the share asked, found by bisection.
 */
function overshootCurve(share: number): number {
	let low = 0;
	let high = 10;
	for (let round = 0; round < 40; round += 1) {
		const c = (low + high) / 2;
		if ((4 * c ** 3) / (27 * (c + 1) ** 2) < share) {
			low = c;
		} else {
			high = c;
		}
	}
	return low;
}

const OVERSHOOT_CURVE = overshootCurve(OVERSHOOT);

/**
 * Leaves at once, goes a little past its end, then settles back: a turn, livelier where nothing
 * is counted.
 */
export function overshoot(t: number): number {
	const c = OVERSHOOT_CURVE;
	return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/** Keeps a share of the time between 0 and 1. */
export function clamp01(t: number): number {
	return Math.min(Math.max(t, 0), 1);
}

/** The value at `t` of the way from `from` to `to`. */
export function lerp(from: number, to: number, t: number): number {
	return from + (to - from) * t;
}

/**
 * Goes smoothly from 0 to 1 between the shares `from` and `to` of the time, and stays at 0 before
 * and at 1 after: one part of an action that has several (step back, pincer out, item lifted).
 */
export function smoothBetween(t: number, from: number, to: number): number {
	return smooth(clamp01((t - from) / (to - from)));
}

/** Leaves fast and stops gently: the robot that comes back from the wall it touched. */
export function easeOut(t: number): number {
	return 1 - (1 - t) ** 3;
}
