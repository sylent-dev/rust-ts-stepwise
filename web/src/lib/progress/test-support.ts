// What the tests of the progress share. Used by the tests alone.

import type { LevelProgress } from './progress.ts';

/** The progress of a level whose maps, by their numbers, passed with these codes. */
export function level(passed: Record<number, string>, done = false): LevelProgress {
	return {
		done,
		passed: new Map(Object.entries(passed).map(([map, code]) => [Number(map), code]))
	};
}
