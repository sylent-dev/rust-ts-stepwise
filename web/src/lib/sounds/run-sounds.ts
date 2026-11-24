// Which sound a run plays, and when (see Sounds in specs.md): a blip as a move or a turn starts,
// up to 2 steps per second; the spring as the front of the robot touches the wall, or as it
// shakes after a `pick_up()` or a `drop()` that fails; the arpeggio as it hops, every goal met;
// the soft slide as it shakes its head at a goal not met, as the line of an error that the map
// doesn't show is marked, or as the console lists the errors that kept the program from
// starting. A run ends with one sound: the one of what stopped it.

import { BUMP_TOUCH, FAILURE_SHAKE, robotFailure, type Action } from '#lib/map/actions.ts';
import type { Outcome } from '#lib/core/core.ts';
import type { Sound } from './recipes.ts';

/** A sound to play, and in how long, in milliseconds. */
export interface Cue {
	readonly sound: Sound;
	readonly delay: number;
}

/**
 * The fastest speed whose moves have their blip, in steps per second: the two slowest speeds.
 * Faster, the blips would become a stream that covers the sounds of the end (decided on
 * 2026-11-15).
 */
export const BLIP_MAX_RATE = 2;

/** The soft slide, at once. */
const FAILURE: Cue = { sound: 'failure', delay: 0 };

/** A sound at once, of a move or a turn, when the speed leaves room for it. */
function blip(sound: Sound, rate: number): Cue | undefined {
	return rate <= BLIP_MAX_RATE ? { sound, delay: 0 } : undefined;
}

/**
 * The sound of an action as the map starts to show it, which takes `time` milliseconds there at
 * `rate` steps per second; nothing for an action that makes none: painting, erasing, an item
 * picked up or dropped, which their animation shows. An action that fails plays its spring at
 * once when the map shows it at once (at **Instant**, or with less motion).
 */
export function actionSound(action: Action, time: number, rate: number): Cue | undefined {
	switch (action) {
		case 'moved':
			return blip('move', rate);
		case 'turned-left':
		case 'turned-right':
			return blip('turn', rate);
		case 'started-painting':
		case 'started-erasing':
		case 'picked-up':
		case 'dropped':
			return undefined;
		case 'bump':
			return { sound: 'bump', delay: BUMP_TOUCH * time };
		case 'already-carrying':
		case 'no-item-here':
		case 'not-carrying':
		case 'item-already-here':
			return { sound: 'bump', delay: FAILURE_SHAKE * time };
		case 'passed':
			return { sound: 'success', delay: 0 };
		case 'goals-not-met':
			return FAILURE;
	}
}

/**
 * The sound of a program that stopped, as its line is marked: the soft slide for an error that
 * the map doesn't show, a division by zero or too many calls in progress. Nothing for one that
 * ran to its end, whose end the robot shows, nor for an error of the robot, which plays as the
 * map shows it (`actionSound`).
 */
export function stopSound(outcome: Outcome): Cue | undefined {
	return outcome.type === 'failed' && robotFailure(outcome) === undefined ? FAILURE : undefined;
}

/** The sound of a **Run** or a **Step** that the checks refuse, nothing moving on the map. */
export const REFUSED_SOUND: Cue = FAILURE;
