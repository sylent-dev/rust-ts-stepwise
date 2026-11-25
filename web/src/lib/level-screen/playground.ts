// What a level screen plays on (see Level screen and Sandbox in specs.md): a map of a level, or
// the sandbox, the level screen without goal. In the core, `Level` and `Sandbox` stay two types,
// since a map of a level without goal must not exist; the screen reads both as one, here.

import type { Goals, Level, Run, Sandbox, World } from '#lib/core/core.ts';
import { SANDBOX } from '#lib/levels/levels.ts';

/**
 * What a level screen plays on: a map of a level, or the sandbox. It reads its level, or the
 * sandbox, when it is made, and `start` calls it: make it once the core is ready, and use it
 * while the level, or the sandbox, is kept in the module.
 */
export interface Playground {
	/** The stable name of the level, or the one of the sandbox: what is saved is saved under it. */
	readonly name: string;
	/** The world at rest, before any program. */
	readonly world: World;
	/** The goals of the map of a level; the sandbox has none. */
	readonly goals?: Goals;
	/**
	 * The number of the map of a level among its maps, from 1, as its tab names it (`Map 1`);
	 * the sandbox has one map, which has no number.
	 */
	readonly mapNumber?: number;
	/** The number of maps of a level; the sandbox has one map, which has no number. */
	readonly mapCount?: number;
	/** The code of a first visit. */
	readonly startingCode: string;
	/**
	 * Starts a program on the map, paused before its first line, on its own copy of the world.
	 * Check the text first: it throws for a program that has errors.
	 */
	readonly start: (text: string) => Run;
}

/**
 * A map of a level, by its place among the maps of the level, from 0; nothing for a place
 * without map. `name` is the stable name of the level.
 */
export function levelPlayground(name: string, level: Level, map: number): Playground | undefined {
	const maps = level.maps();
	const found = maps[map];
	if (!found) return undefined;
	return {
		name,
		world: found.world,
		goals: found.goals,
		mapNumber: map + 1,
		mapCount: maps.length,
		startingCode: level.startingCode(),
		start: (text) => level.start(map, text)
	};
}

/** The sandbox: its open map, without goal. */
export function sandboxPlayground(sandbox: Sandbox): Playground {
	return {
		name: SANDBOX,
		world: sandbox.world(),
		startingCode: sandbox.startingCode(),
		start: (text) => sandbox.start(text)
	};
}
