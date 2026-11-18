// The animation of a step on the map (see Animations in specs.md): which actions the map
// animates, how long they take at each speed, and where the robot stands at each moment. The
// reference is the mock-up, `docs/mockups/world-elements/motion.js`.

import type { Direction, Robot, StepEvent, World } from '#lib/core.ts';
import { overshoot, smooth } from './easing.ts';

/** The actions that the map animates: a move, a turn, a tool put down. */
export type AnimatedAction = Extract<
	StepEvent,
	'moved' | 'turned-left' | 'turned-right' | 'started-painting' | 'started-erasing'
>;

const ANIMATED: readonly StepEvent[] = [
	'moved',
	'turned-left',
	'turned-right',
	'started-painting',
	'started-erasing'
] satisfies AnimatedAction[];

/**
 * Whether the map animates what a step showed. A line without action, a line printed and a tool
 * lifted show nothing: the highlighted line moves on at once.
 */
export function isAnimated(event: StepEvent): event is AnimatedAction {
	return ANIMATED.includes(event);
}

/**
 * The step under way on the map: its action, and the world as the step leaves it. The world as
 * the step found it is the one the map draws meanwhile.
 */
export interface Motion {
	action: AnimatedAction;
	after: World;
}

/** The time an action takes at the normal speed, 2 steps per second (decided at step 11a). */
export const ACTION_TIME = 300;

/** The share of a step that an action takes at most, so that the robot rests between two. */
const ACTION_SHARE = 0.8;

/**
 * The time an action takes at `rate` steps per second: the one of the normal speed, shortened
 * when a step is shorter, so that the robot still rests a moment between two steps. Nothing at
 * **Instant**, which draws no animation.
 */
export function actionTime(rate: number): number {
	return Math.min(ACTION_TIME, (ACTION_SHARE * 1000) / rate);
}

/** Where the robot stands: its place in cells, which may lie between two, and its angle. */
export interface Pose {
	x: number;
	y: number;
	/** In degrees, clockwise from the north, which the drawing of the robot faces. */
	angle: number;
}

const ANGLES: Readonly<Record<Direction, number>> = { north: 0, east: 90, south: 180, west: 270 };

/** The robot at rest on its cell, facing its direction. */
export function restingPose(robot: Robot): Pose {
	return { x: robot.position.x, y: robot.position.y, angle: ANGLES[robot.direction] };
}

/**
 * Where `robot`, as the step found it, stands at `t` of the step, from 0 to 1: it slides to the
 * next cell, starting and stopping gently; it turns a quarter, going 4.5° past it before it
 * settles back; it stays on its cell while it puts a tool down.
 */
export function poseAt(robot: Robot, motion: Motion, t: number): Pose {
	const rest = restingPose(robot);
	switch (motion.action) {
		case 'moved': {
			const to = motion.after.robot.position;
			const way = smooth(t);
			return { ...rest, x: rest.x + (to.x - rest.x) * way, y: rest.y + (to.y - rest.y) * way };
		}
		case 'turned-left':
			return { ...rest, angle: rest.angle - 90 * overshoot(t) };
		case 'turned-right':
			return { ...rest, angle: rest.angle + 90 * overshoot(t) };
		case 'started-painting':
		case 'started-erasing':
			return rest;
	}
}
