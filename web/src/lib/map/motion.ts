// Where the robot stands at each moment of what the map animates (see Animations in specs.md),
// with full motion or less of it. Which actions the map animates, and how long they take, is
// actions.ts. The reference is the mock-up, `docs/mockups/world-elements/motion.js`.

import type { Direction, Robot, World } from '#lib/core/core.ts';
import { BUMP_TOUCH, FAILURE_SHAKE, type Action } from './actions.ts';
import { clamp01, easeOut, overshoot, smooth, smoothBetween } from './easing.ts';
import { STEPS } from './geometry.ts';

/**
 * What the map animates, a step or the end of the run: its action, and the world as it leaves it.
 * The world as the step found it is the one the map draws meanwhile; an error of the robot and the
 * end of a run leave it as it was.
 */
export interface Motion {
	action: Action;
	after: World;
	/**
	 * Whether the learner asked their system for less motion when it started: nothing bounces nor
	 * shakes (see Animations in specs.md).
	 */
	lessMotion?: boolean;
}

/** Where the robot stands: its place in cells, which may lie between two, and its angle. */
export interface Pose {
	x: number;
	y: number;
	/** In degrees, clockwise from the north, which the drawing of the robot faces. */
	angle: number;
	/** How high it is in a hop, from 0, on the floor, to 1; on the floor when absent. */
	lift?: number;
}

const ANGLES: Readonly<Record<Direction, number>> = { north: 0, east: 90, south: 180, west: 270 };

/** The robot at rest on its cell, facing its direction. */
export function restingPose(robot: Robot): Pose {
	return { x: robot.position.x, y: robot.position.y, angle: ANGLES[robot.direction] };
}

/**
 * How far the robot steps back to pick up or drop an item, as a share of a cell, so that the
 * item of its cell shows at its front: a small shuffle more than a retreat (decided at step 11a).
 */
export const STEP_BACK = 0.25;

/** How far the robot goes forward in a bump, as a share of a cell: its front touches the border. */
const TOUCH = 0.2;

/** `pose` moved `amount` of a cell ahead of the robot, or behind it when `amount` is negative. */
function ahead(pose: Pose, direction: Direction, amount: number): Pose {
	const step = STEPS[direction];
	return { ...pose, x: pose.x + step.x * amount, y: pose.y + step.y * amount };
}

/**
 * The shake of an error, from the share `from` of the time to its end: three wobbles of 8° that
 * die out, back to the angle at rest.
 */
function shaken(pose: Pose, t: number, from: number): Pose {
	if (t <= from) return pose;
	const u = clamp01((t - from) / (1 - from));
	return { ...pose, angle: pose.angle + 8 * Math.sin(Math.PI * 6 * u) * (1 - u) };
}

/**
 * How far the robot goes toward the wall it bumps into, as a share of a cell: faster and faster
 * until its front touches the border of its cell, then back onto it.
 */
function touching(t: number): number {
	if (t < BUMP_TOUCH) return TOUCH * (t / BUMP_TOUCH) ** 2;
	return TOUCH * (1 - easeOut(clamp01((t - BUMP_TOUCH) / 0.4)));
}

/** The share of the end of a run that the hop takes, the robot resting afterwards. */
const HOP_SHARE = 0.55;

/** The share of the end of a run that the shake of the head takes, the flags coming after it. */
export const HEAD_SHAKE_SHARE = 0.6;

/** The robot at `t` of the end of a run: up and down once, in the hop, then on the floor. */
function hopped(pose: Pose, t: number): Pose {
	if (t >= HOP_SHARE) return pose;
	return { ...pose, lift: Math.sin((Math.PI * clamp01(t)) / HOP_SHARE) };
}

/**
 * The robot that shakes its head at a goal not met: two wobbles of 12°, slower and wider than the
 * shake of an error, that die out a little.
 */
function headShaken(pose: Pose, t: number): Pose {
	if (t >= HEAD_SHAKE_SHARE) return pose;
	const u = clamp01(t / HEAD_SHAKE_SHARE);
	return { ...pose, angle: pose.angle + 12 * Math.sin(Math.PI * 4 * u) * (1 - 0.4 * u) };
}

/**
 * Where `robot`, as the step found it, stands at `t` of the step, from 0 to 1: it slides to the
 * next cell, starting and stopping gently; it turns a quarter, going 4.5° past it before it
 * settles back; it stays on its cell while it puts a tool down; it steps back a quarter of a cell
 * and rolls back onto its cell to pick up or drop an item. A bump sends it forward until its front
 * touches the border of its cell, then back onto it shaking its body; a `pick_up()` or a `drop()`
 * that fails steps back and rolls back as one that works, then shakes. At the end of a run, it
 * hops once when every goal is met, and shakes its head when one isn't.
 *
 * With less motion, nothing bounces nor shakes: a turn stops gently without going past its end,
 * the robot stays on its cell to pick up or drop an item, and a bump only touches the border.
 */
export function poseAt(robot: Robot, motion: Motion, t: number): Pose {
	const rest = restingPose(robot);
	const { direction } = robot;
	const full = motion.lessMotion !== true;
	const turned = full ? overshoot(t) : smooth(t);
	switch (motion.action) {
		case 'moved': {
			const to = motion.after.robot.position;
			const way = smooth(t);
			return { ...rest, x: rest.x + (to.x - rest.x) * way, y: rest.y + (to.y - rest.y) * way };
		}
		case 'turned-left':
			return { ...rest, angle: rest.angle - 90 * turned };
		case 'turned-right':
			return { ...rest, angle: rest.angle + 90 * turned };
		case 'started-painting':
		case 'started-erasing':
			return rest;
		case 'picked-up':
		case 'dropped':
			if (!full) return rest;
			return ahead(
				rest,
				direction,
				-STEP_BACK * (smoothBetween(t, 0, 0.3) - smoothBetween(t, 0.7, 1))
			);
		case 'bump': {
			const touched = ahead(rest, direction, touching(t));
			return full ? shaken(touched, t, BUMP_TOUCH) : touched;
		}
		case 'already-carrying':
		case 'no-item-here':
		case 'not-carrying':
		case 'item-already-here': {
			if (!full) return rest;
			const back = smoothBetween(t, 0, 0.2) - smoothBetween(t, 0.45, FAILURE_SHAKE);
			return shaken(ahead(rest, direction, -STEP_BACK * back), t, FAILURE_SHAKE);
		}
		case 'passed':
			return full ? hopped(rest, t) : rest;
		case 'goals-not-met':
			return full ? headShaken(rest, t) : rest;
	}
}
