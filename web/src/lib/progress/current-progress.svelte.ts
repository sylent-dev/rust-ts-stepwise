// The progress of the learner in this browser (see saved-progress.ts): read when the application
// starts, saved as each map passes. It is held here while the page is open, so that a browser that
// refuses to save still keeps it until the tab closes (see Error handling in specs.md), and it
// follows what another tab saves.

import { store } from '#lib/storage/browser-store.svelte.ts';
import { passMap, progressOf, withLevel, type LevelProgress, type Progress } from './progress.ts';
import { loadProgress, saveLevelProgress } from './saved-progress.ts';

let current = $state.raw<Progress>(loadProgress(store));

/** The progress of every level. It follows the progress as it changes. */
export function currentProgress(): Progress {
	return current;
}

/** The progress of a level, by its stable name. It follows the progress as it changes. */
export function levelProgress(level: string): LevelProgress {
	return progressOf(current, level);
}

/**
 * Keeps that `code` has passed the map numbered `map` of a level of `count` maps, and saves it:
 * the progress of the level afterwards.
 */
export function keepPass(level: string, map: number, code: string, count: number): LevelProgress {
	const passed = passMap(progressOf(current, level), map, code, count);
	current = withLevel(current, level, passed);
	saveLevelProgress(store, level, passed);
	return passed;
}

/** Takes the progress as the browser holds it now: another tab has just saved it. */
export function followSavedProgress(): void {
	current = loadProgress(store);
}
