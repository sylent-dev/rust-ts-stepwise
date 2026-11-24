// The actions that the map animates (see Animations in specs.md): the action of a step, the error
// of the robot that stopped the program, and the end of a run, how long each one takes at each
// speed, and the moments within them that the sounds follow. Where the robot stands meanwhile is
// motion.ts. The reference is the mock-up, `docs/mockups/world-elements/motion.js`.

import type { Outcome, RobotError, RuntimeErrorKind, StepEvent } from '#lib/core/core.ts';

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
 * The ends of a run that the robot shows, once its last action has ended: every goal met, or a
 * goal not met. A run of the sandbox, which has no goal, and a run stopped on an error show none.
 */
export type RunEnd = Extract<Outcome['type'], 'passed' | 'goals-not-met'>;

/**
 * What the map animates: the action of a step, the one the robot failed (an error of the robot,
 * `RobotError`, which the bridge gives as one group: the bump into a wall or the edge of the
 * map, and the `pick_up()` and `drop()` that fail), or the end of the run after its last step.
 */
export type Action = AnimatedEvent | RobotError | RunEnd;

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
} as const satisfies Record<RobotError, number>;

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

/** Whether an action is the one of a step, rather than an error of the robot or the end of a run. */
function isEvent(action: Action): action is AnimatedEvent {
	return Object.hasOwn(EVENT_TIMES, action);
}

/**
 * Whether the code of an error is one of the robot. Its type holds the group to the codes of the
 * errors of a run: a name of the group that is none of them is refused.
 */
function isRobotError(code: RuntimeErrorKind['code']): code is RobotError {
	return Object.hasOwn(FAILURE_TIMES, code);
}

/**
 * The error of the robot that stopped a run, which the map shows; nothing for a run that ended
 * well, or that another error stopped.
 */
export function robotFailure(outcome: Outcome | undefined): RobotError | undefined {
	if (outcome?.type !== 'failed') return undefined;
	const { code } = outcome.error.kind;
	return isRobotError(code) ? code : undefined;
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
	if (isEvent(action)) return Math.min(EVENT_TIMES[action], (ACTION_SHARE * 1000) / rate);
	return lessMotion && action !== 'bump' ? 0 : FAILURE_TIMES[action];
}

/**
 * The share of a bump at which the front of the robot touches the border of its cell, faster
 * and faster, before it comes back onto its cell: the moment the bump is heard.
 */
export const BUMP_TOUCH = 0.3;

/**
 * The share of a `pick_up()` or a `drop()` that fails at which the robot, back on its cell
 * after it showed what goes wrong, starts to shake: the moment the failure is heard.
 */
export const FAILURE_SHAKE = 0.6;
