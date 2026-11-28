// The progress of the learner through the levels (see Levels and progression in specs.md): for each
// level, the code that passed each of its maps, and whether it is done, every map passed with the
// same code. A tab of a map is teal while the code is the very text that passed it, so that undoing
// back to that text brings the teal back (decided on 2026-11-25). A level done stays done, whatever
// its code becomes. Nothing here knows how it is saved (saved-progress.ts).

import { mapNumbers } from '#lib/levels/level-maps.ts';

/** What the learner has done in a level. */
export interface LevelProgress {
	/** Whether the level is done: every map passed with the same code. It stays so. */
	readonly done: boolean;
	/** The code that passed each map, by the number of the map, from 1, as its tab names it. */
	readonly passed: ReadonlyMap<number, string>;
}

/** The progress of the levels, by their stable names; a level that the learner hasn't passed yet isn't there. */
export type Progress = ReadonlyMap<string, LevelProgress>;

/** The progress of a level that no map has passed yet. */
export const NOT_STARTED: LevelProgress = { done: false, passed: new Map() };

/** The progress of a level, by its stable name. */
export function progressOf(progress: Progress, level: string): LevelProgress {
	return progress.get(level) ?? NOT_STARTED;
}

/** The progress with the one of a level in place of what it held. */
export function withLevel(progress: Progress, level: string, kept: LevelProgress): Progress {
	return new Map([...progress, [level, kept]]);
}

/** The maps of a level that `code` has passed, by their numbers. */
export function mapsPassedWith(level: LevelProgress, code: string): ReadonlySet<number> {
	return new Set([...level.passed].filter(([, passedBy]) => passedBy === code).map(([map]) => map));
}

/** Whether `code` has passed every map of a level of `count` maps: the level is done with it. */
export function passedEvery(level: LevelProgress, code: string, count: number): boolean {
	return mapToTry(mapsPassedWith(level, code), count) === undefined;
}

/**
 * A level once `code` has passed its map numbered `map`, of `count`: the code is kept for that map,
 * in place of the one that passed it before, and the level is done once every map has passed with
 * that code.
 */
export function passMap(
	level: LevelProgress,
	map: number,
	code: string,
	count: number
): LevelProgress {
	const next = { ...level, passed: new Map(level.passed).set(map, code) };
	return { ...next, done: next.done || passedEvery(next, code, count) };
}

/**
 * The map to try next, among the `count` of a level: the first that isn't in `passed`; nothing
 * once every map is.
 */
export function mapToTry(passed: ReadonlySet<number>, count: number): number | undefined {
	return mapNumbers(count).find((map) => !passed.has(map));
}

/**
 * Whether the level numbered `number`, from 1, among `levels`, the stable names of the levels in
 * their order, is open: the first, a level done, or a level whose level before it is done. A level
 * added later after a level done is so open, and the learner goes on where they were (decided on
 * 2026-11-28). Not a level of the list: never.
 */
export function isOpen(progress: Progress, levels: readonly string[], number: number): boolean {
	const name = levels[number - 1];
	if (name === undefined) return false;
	if (number === 1 || progressOf(progress, name).done) return true;
	const before = levels[number - 2];
	return before !== undefined && progressOf(progress, before).done;
}

/**
 * The level to play before the level numbered `number`, which is locked: the last level open
 * before it, which isn't done, since the one after it would be open. Nothing for a level that is
 * open, or not of the list.
 */
export function levelToPlay(
	progress: Progress,
	levels: readonly string[],
	number: number
): number | undefined {
	if (number < 1 || number > levels.length || isOpen(progress, levels, number)) return undefined;
	for (let before = number - 1; before >= 1; before -= 1) {
		if (isOpen(progress, levels, before)) return before;
	}
	return undefined;
}

/** How many of `levels`, the stable names of the levels, are done. */
export function levelsDone(progress: Progress, levels: readonly string[]): number {
	return levels.filter((name) => progressOf(progress, name).done).length;
}
