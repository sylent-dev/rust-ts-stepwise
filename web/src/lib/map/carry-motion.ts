// What the robot does with an item while a step runs (see Animations in specs.md): its pincer,
// the item it holds between the floor and the bay, the item of its bay and the one of its cell.
// Everything is in the units of the drawings (geometry.ts), along the robot as its drawing faces
// north; the reference is the mock-up, `docs/mockups/world-elements/motion.js`.

import type { World } from '#lib/core.ts';
import { clamp01, lerp, smoothBetween } from './easing.ts';
import { CELL, cellAt } from './geometry.ts';
import { STEP_BACK, type Action } from './motion.ts';

/** The size of the item in the bay, as a share of the item on the floor. */
export const IN_BAY = 0.5;

/** The middle of the bay, from the middle of the robot toward its back. */
export const BAY = 7.5;

/**
 * The item of the cell, from the middle of the robot that has stepped back to pick it up or drop
 * it: ahead of the robot by the length of its step back.
 */
const ON_CELL = -STEP_BACK * CELL;

/** Where the item stops on its way out of the bay, when the cell has one already. */
const HELD_BACK = -7.7;

/** The item in the pincer, between the floor and the bay. */
export interface Held {
	/** Its place along the robot, from its middle toward its back; ahead of it when negative. */
	along: number;
	/** Its size, as a share of the item on the floor. */
	size: number;
}

/** What the robot does with an item at a moment. */
export interface Carry {
	/** How far its pincer is out of its front, from 0, in, to 1, out. */
	pincer: number;
	/** The size of the item of its bay, as a share of the item on the floor; nothing when empty. */
	bay?: number;
	/** The item its pincer holds, if any. */
	held?: Held;
	/** Whether an item lies on its cell, under it. */
	floor: boolean;
}

/** Larger in the middle of its way, as if lifted. */
function lifted(t: number): number {
	return 1 + 0.15 * Math.sin(Math.PI * t);
}

/** The pincer of a `pick_up()` or a `drop()` that fails: out, empty, and back in. */
function tried(t: number): number {
	return smoothBetween(t, 0.05, 0.2) - smoothBetween(t, 0.35, 0.5);
}

/**
 * What the robot of `before`, the world as the step found it, does with an item at `t` of the
 * step of `action`, from 0 to 1. It picks up the item of its cell into its bay, over itself, a little larger
 * as if lifted, or brings it back from the bay and sets it down on its cell, with its pincer out.
 * When the action fails, its pincer comes out empty (nothing to pick up, nothing to drop), its
 * full bay swells (an item already carried), or the item comes out of the bay and goes back into
 * it (an item already on the cell). At rest, and for another action, nothing moves.
 */
export function carryAt(before: World, action: Action | undefined, t: number): Carry {
	const { position, carrying } = before.robot;
	const cell = cellAt(before, position);
	const rest: Carry = {
		pincer: 0,
		bay: carrying ? IN_BAY : undefined,
		floor: cell?.type === 'floor' && cell.item
	};
	switch (action) {
		case 'picked-up': {
			const way = smoothBetween(t, 0.4, 0.8);
			return {
				pincer: smoothBetween(t, 0.05, 0.3) - smoothBetween(t, 0.55, 0.8),
				bay: t >= 0.8 ? IN_BAY : undefined,
				held:
					t >= 0.4 && t < 0.8
						? { along: lerp(ON_CELL, BAY, way), size: lerp(1, IN_BAY, way) * lifted(way) }
						: undefined,
				floor: t < 0.4
			};
		}
		case 'dropped': {
			const way = smoothBetween(t, 0.25, 0.65);
			return {
				pincer: smoothBetween(t, 0.05, 0.3) - smoothBetween(t, 0.6, 0.85),
				bay: t < 0.25 ? IN_BAY : undefined,
				held:
					t >= 0.25 && t < 0.65
						? { along: lerp(BAY, ON_CELL, way), size: lerp(IN_BAY, 1, way) * lifted(way) }
						: undefined,
				floor: t >= 0.65
			};
		}
		case 'no-item-here':
		case 'not-carrying':
			return { ...rest, pincer: tried(t) };
		case 'already-carrying':
			return {
				...rest,
				pincer: tried(t),
				bay: IN_BAY * (1 + 0.3 * Math.sin(Math.PI * clamp01((t - 0.18) / 0.22)))
			};
		case 'item-already-here': {
			const out = t > 0.12 && t < 0.46;
			const way = smoothBetween(t, 0.12, 0.28) - smoothBetween(t, 0.3, 0.46);
			return {
				...rest,
				pincer: tried(t),
				bay: out ? undefined : IN_BAY,
				held: out ? { along: lerp(BAY, HELD_BACK, way), size: lerp(IN_BAY, 0.85, way) } : undefined
			};
		}
		default:
			return rest;
	}
}
