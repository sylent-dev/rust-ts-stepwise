// The animation of a step on the map (see Animations in specs.md): which actions the map
// animates, how long they take at each speed, and where the robot stands at each moment. The
// reference is the mock-up, `docs/mockups/world-elements/motion.js`.

import type { Direction, Outcome, Robot, RuntimeErrorKind, StepEvent, World } from '#lib/core.ts';
import { clamp01, easeOut, overshoot, smooth, smoothBetween } from './easing.ts';
import { STEPS } from './geometry.ts';

/** The actions of a program that the map animates: a move, a turn, a tool put down, an item. */
export type AnimatedEvent = Extract<
	StepEvent,
	| 'moved'
	| 'turned-left'
	| 'turned-right'
	| 'started-painting'
	| 'started-erasing'
	| 'picked-up'
	| 'dropped'
>;

/**
 * The errors of the robot that the map shows: the bump into a wall or the edge of the map, and
 * the `pick_up()` and `drop()` that fail. The others show nothing on the map.
 */
export type RobotFailure = Extract<
	RuntimeErrorKind['code'],
	'bump' | 'already-carrying' | 'no-item-here' | 'not-carrying' | 'item-already-here'
>;

/** What the map animates in a step: an action of the robot, or the one it failed. */
export type Action = AnimatedEvent | RobotFailure;

/**
 * The time each action of the program that the map animates takes at the normal speed, 2 steps
 * per second (decided at step 11a): a move, a turn or a tool 300 ms; an item 400 ms, since it
 * travels between the floor and the bay. Its keys are the actions animated.
 */
const EVENT_TIMES = {
	moved: 300,
	'turned-left': 300,
	'turned-right': 300,
	'started-painting': 300,
	'started-erasing': 300,
	'picked-up': 400,
	dropped: 400
} satisfies Readonly<Record<AnimatedEvent, number>>;

/**
 * The time each error of the robot that the map shows takes, at every speed: a bump 450 ms, and a
 * `pick_up()` or a `drop()` that fails 650 ms, since they show what goes wrong before the robot
 * shakes. Its keys are the errors shown.
 */
const FAILURE_TIMES = {
	bump: 450,
	'already-carrying': 650,
	'no-item-here': 650,
	'not-carrying': 650,
	'item-already-here': 650
} satisfies Readonly<Record<RobotFailure, number>>;

/**
 * Whether the map animates what a step showed. A line without action, a line printed and a tool
 * lifted show nothing: the highlighted line moves on at once.
 */
export function isAnimated(event: StepEvent): event is AnimatedEvent {
	return Object.hasOwn(EVENT_TIMES, event);
}

/** Whether an action, or the code of an error, is an error of the robot that the map shows. */
function isFailure(code: string): code is RobotFailure {
	return Object.hasOwn(FAILURE_TIMES, code);
}

/**
 * The error of the robot that stopped a run, which the map shows; nothing for a run that ended
 * well, or that another error stopped.
 */
export function robotFailure(outcome: Outcome | undefined): RobotFailure | undefined {
	if (outcome?.type !== 'failed') return undefined;
	const { code } = outcome.error.kind;
	return isFailure(code) ? code : undefined;
}

/**
 * The step under way on the map: its action, and the world as the step leaves it. The world as
 * the step found it is the one the map draws meanwhile; an error of the robot leaves it as it was.
 */
export interface Motion {
	action: Action;
	after: World;
}

/**
 * The share of a step that an action takes at most, so that the robot rests between two: 160 ms
 * at 5 steps per second, 40 ms at 20 (tried on the bench, decided on 2026-11-18).
 */
const ACTION_SHARE = 0.8;

/**
 * The time `action` takes at `rate` steps per second: the one of the normal speed, shortened when
 * a step is shorter, so that the robot still rests a moment between two steps. An error of the
 * robot keeps its whole time at every speed: it stops the program, so no step waits after it.
 * Nothing at **Instant**, which draws no animation.
 */
export function actionTime(action: Action, rate: number): number {
	if (!Number.isFinite(rate)) return 0;
	if (isFailure(action)) return FAILURE_TIMES[action];
	return Math.min(EVENT_TIMES[action], (ACTION_SHARE * 1000) / rate);
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
	return t < 0.3 ? TOUCH * (t / 0.3) ** 2 : TOUCH * (1 - easeOut(clamp01((t - 0.3) / 0.4)));
}

/**
 * Where `robot`, as the step found it, stands at `t` of the step, from 0 to 1: it slides to the
 * next cell, starting and stopping gently; it turns a quarter, going 4.5° past it before it
 * settles back; it stays on its cell while it puts a tool down; it steps back a quarter of a cell
 * and rolls back onto its cell to pick up or drop an item. A bump sends it forward until its front
 * touches the border of its cell, then back onto it shaking its body; a `pick_up()` or a `drop()`
 * that fails steps back and rolls back as one that works, then shakes.
 */
export function poseAt(robot: Robot, motion: Motion, t: number): Pose {
	const rest = restingPose(robot);
	const { direction } = robot;
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
		case 'picked-up':
		case 'dropped':
			return ahead(
				rest,
				direction,
				-STEP_BACK * (smoothBetween(t, 0, 0.3) - smoothBetween(t, 0.7, 1))
			);
		case 'bump':
			return shaken(ahead(rest, direction, touching(t)), t, 0.3);
		case 'already-carrying':
		case 'no-item-here':
		case 'not-carrying':
		case 'item-already-here': {
			const back = smoothBetween(t, 0, 0.2) - smoothBetween(t, 0.45, 0.6);
			return shaken(ahead(rest, direction, -STEP_BACK * back), t, 0.6);
		}
	}
}
