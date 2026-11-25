// The progress of the learner through the levels (see Levels and progression in specs.md): for each
// level, the code that passed each of its maps, and whether it is done, every map passed with the
// same code. A tab of a map is teal while the code is the very text that passed it, so that undoing
// back to that text brings the teal back (decided on 2026-11-25). A level done stays done, whatever
// its code becomes. Nothing here knows how it is saved (saved-progress.ts).

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
	const passed = { done: level.done, passed: new Map(level.passed).set(map, code) };
	return { ...passed, done: passed.done || passedEvery(passed, code, count) };
}

/**
 * The map to try next, among the `count` of a level: the first that isn't in `passed`; nothing
 * once every map is.
 */
export function mapToTry(passed: ReadonlySet<number>, count: number): number | undefined {
	return Array.from({ length: count }, (_, index) => index + 1).find((map) => !passed.has(map));
}
