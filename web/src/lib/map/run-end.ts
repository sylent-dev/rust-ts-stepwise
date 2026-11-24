// What the map shows of the end of a run, beside the pose of the robot (see Animations in
// specs.md): its eyes, lit when every goal is met and dimmed when one isn't, the flags planted on
// the goals not met, and the shadow of its hop. They stay until the map is put back. The reference
// is the mock-up, `docs/mockups/world-elements/motion.js`.

import type { Outcome, Point } from '#lib/core/core.ts';
import type { WorldElement } from '#lib/elements.ts';
import { clamp01, overshoot } from './easing.ts';
import { runEnd, type RunEnd } from './actions.ts';
import { HEAD_SHAKE_SHARE, type Motion, type Pose } from './motion.ts';

/** The eyes of the robot at each end of a run, drawn over its own. */
const EYES = {
	passed: 'eyesLit',
	'goals-not-met': 'eyesDim'
} as const satisfies Record<RunEnd, WorldElement>;

/** The eyes of the robot at the end of a run, drawn over its own. */
export type Eyes = (typeof EYES)[RunEnd];

/** The eyes of the robot once the run has ended: none for the sandbox, an error, or a run. */
export function eyesOf(outcome: Outcome | undefined): Eyes | undefined {
	const end = runEnd(outcome);
	return end && EYES[end];
}

/**
 * The cells of the goals not met, each once, in the order of the goals, where the map plants its
 * flags; what the robot carries has no cell, so only the console says it.
 */
export function missedCells(outcome: Outcome | undefined): Point[] {
	if (outcome?.type !== 'goals-not-met') return [];
	const cells = new Map<string, Point>();
	for (const goal of outcome.goals) {
		if ('at' in goal) cells.set(`${goal.at.x},${goal.at.y}`, goal.at);
	}
	return [...cells.values()];
}

/** The share of the end of a run that the flags take to be planted, after the shake of the head. */
const PLANTING_SHARE = 0.35;

/**
 * The share of the end of a run that a flag takes at least to be planted, 150 ms, so that its
 * bounce shows: many flags then start before the one before them has ended, in a wave.
 */
const MIN_FLAG_SHARE = 1 / 6;

/**
 * The size of the flag `index` of `count`, from 0 to 1 and a little more as it bounces: once the
 * head has shaken, the flags are planted one after the other, each in its share of the time, or
 * in a wave when they are many. At rest, and with less motion, every flag is there.
 */
export function flagSize(
	motion: Motion | undefined,
	t: number,
	index: number,
	count: number
): number {
	if (motion?.action !== 'goals-not-met' || motion.lessMotion === true) return 1;
	const each = Math.max(PLANTING_SHARE / count, MIN_FLAG_SHARE);
	const stagger = count > 1 ? (PLANTING_SHARE - each) / (count - 1) : 0;
	return overshoot(clamp01((t - HEAD_SHAKE_SHARE - index * stagger) / each));
}

/** The foot of the pole of a flag, in the units of its drawing, where it is planted from. */
export const FLAG_FOOT = { x: 47, y: 27 } as const;

/** How far the shadow of a hop moves away toward the bottom left, at its highest, in units. */
const HOP_REACH = 7;

/** How much larger the robot is at the top of its hop, as a share of its size. */
export const HOP_GROWTH = 0.16;

/** The shadow of the robot in a hop: how far it has moved toward the bottom left, and its opacity. */
export interface HopShadow {
	reach: number;
	opacity: number;
}

/**
 * The shadow of the robot of `pose` in a hop, which moves away toward the bottom left as the robot
 * rises, the sun being at the top right, and grows lighter; nothing on the floor, where the robot
 * covers it. The ink of the world at 22 %, darker than the shadows of the walls since it lies
 * close to what casts it: as in the mock-up, tuned by eye at step 11a.
 */
export function hopShadow(pose: Pose): HopShadow | undefined {
	const lift = pose.lift ?? 0;
	if (lift <= 0) return undefined;
	return { reach: HOP_REACH * lift, opacity: 0.22 * (1 - 0.3 * lift) };
}
