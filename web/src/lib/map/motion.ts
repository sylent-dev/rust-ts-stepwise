// The animation of a step on the map (see Animations in specs.md): which actions the map
// animates, how long they take at each speed, and where the robot stands at each moment, with
// full motion or less of it. The reference is the mock-up, `docs/mockups/world-elements/motion.js`.

import type {
	Direction,
	Outcome,
	Robot,
	RuntimeErrorKind,
	StepEvent,
	World
} from '#lib/core/core.ts';
import { clamp01, easeOut, overshoot, smooth, smoothBetween } from './easing.ts';
import { STEPS } from './geometry.ts';

/**
 * The time each event of a step takes on the map at the normal speed, 2 steps per second (decided
 * at step 11a): a move, a turn or a tool put down 300 ms; an item 400 ms, since it travels between
 * the floor and the bay. Nothing for what the map doesn't animate, where the highlighted line
 * moves on at once: a line without action, a line printed, a tool lifted. Its keys are every
 * event of the core: a new one doesn't compile until it is placed here.
 */
const EVENT_TIMES = {
	nothing: undefined,
	printed: undefined,
	moved: 300,
	'turned-left': 300,
	'turned-right': 300,
	'started-painting': 300,
	'stopped-painting': undefined,
	'started-erasing': 300,
	'stopped-erasing': undefined,
	'picked-up': 400,
	dropped: 400
} as const satisfies Record<StepEvent, number | undefined>;

/**
 * The actions of a program that the map animates: a move, a turn, a tool put down, an item. They
 * are the events that have a time above.
 */
export type AnimatedEvent = {
	[Name in StepEvent]: (typeof EVENT_TIMES)[Name] extends number ? Name : never;
}[StepEvent];

/**
 * The errors of the robot that the map shows: the bump into a wall or the edge of the map, and
 * the `pick_up()` and `drop()` that fail. The others show nothing on the map.
 */
export type RobotFailure = Extract<
	RuntimeErrorKind['code'],
	'bump' | 'already-carrying' | 'no-item-here' | 'not-carrying' | 'item-already-here'
>;

/**
 * The ends of a run that the robot shows, once its last action has ended: every goal met, or a
 * goal not met. A run of the sandbox, which has no goal, and a run stopped on an error show none.
 */
export type RunEnd = Extract<Outcome['type'], 'passed' | 'goals-not-met'>;

/**
 * What the map animates: the action of a step, the one the robot failed, or the end of the run
 * after its last step.
 */
export type Action = AnimatedEvent | RobotFailure | RunEnd;

/**
 * The time each error of the robot that the map shows takes, at every animated speed: a bump
 * 450 ms, and a `pick_up()` or a `drop()` that fails 650 ms, since they show what goes wrong before
 * the robot shakes. Its keys are the errors shown.
 */
const FAILURE_TIMES = {
	bump: 450,
	'already-carrying': 650,
	'no-item-here': 650,
	'not-carrying': 650,
	'item-already-here': 650
} as const satisfies Record<RobotFailure, number>;

/**
 * The time each end of a run takes, at every animated speed, since no step waits after it: the
 * eyes and a hop, or the eyes, a shake of the head and the flags, 900 ms. The success panel of a
 * level appears after it (step 21).
 */
const END_TIMES = {
	passed: 900,
	'goals-not-met': 900
} as const satisfies Record<RunEnd, number>;

/**
 * Whether the map animates what a step showed. A line without action, a line printed and a tool
 * lifted show nothing: the highlighted line moves on at once.
 */
export function isAnimated(event: StepEvent): event is AnimatedEvent {
	return EVENT_TIMES[event] !== undefined;
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

/** Whether an action is the end of a run, rather than a step. */
export function isRunEnd(action: Action): action is RunEnd {
	return Object.hasOwn(END_TIMES, action);
}

/** The end of a run that the robot shows; nothing for the sandbox, an error, or a run under way. */
export function runEnd(outcome: Outcome | undefined): RunEnd | undefined {
	return outcome?.type === 'passed' || outcome?.type === 'goals-not-met' ? outcome.type : undefined;
}

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

/**
 * The share of a step that an action takes at most, so that the robot rests between two: 160 ms
 * at 5 steps per second, 40 ms at 20 (tried on the bench of step 14, decided on 2026-11-18).
 */
const ACTION_SHARE = 0.8;

/**
 * The time `action` takes at `rate` steps per second: the one of the normal speed, shortened when
 * a step is shorter, so that the robot still rests a moment between two steps. An error of the
 * robot and the end of a run keep their whole time at every animated speed: no step waits after
 * them. Nothing at **Instant**, which draws no animation.
 *
 * With less motion, a `pick_up()` or a `drop()` that fails is shown by its error alone, and the
 * end of a run by the eyes and the flags alone: both take no time, the bump keeps its own.
 */
export function actionTime(action: Action, rate: number, lessMotion = false): number {
	if (!Number.isFinite(rate)) return 0;
	if (isRunEnd(action)) return lessMotion ? 0 : END_TIMES[action];
	if (isFailure(action)) return lessMotion && action !== 'bump' ? 0 : FAILURE_TIMES[action];
	return Math.min(EVENT_TIMES[action], (ACTION_SHARE * 1000) / rate);
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
	return t < 0.3 ? TOUCH * (t / 0.3) ** 2 : TOUCH * (1 - easeOut(clamp01((t - 0.3) / 0.4)));
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
			return full ? shaken(touched, t, 0.3) : touched;
		}
		case 'already-carrying':
		case 'no-item-here':
		case 'not-carrying':
		case 'item-already-here': {
			if (!full) return rest;
			const back = smoothBetween(t, 0, 0.2) - smoothBetween(t, 0.45, 0.6);
			return shaken(ahead(rest, direction, -STEP_BACK * back), t, 0.6);
		}
		case 'passed':
			return full ? hopped(rest, t) : rest;
		case 'goals-not-met':
			return full ? headShaken(rest, t) : rest;
	}
}
