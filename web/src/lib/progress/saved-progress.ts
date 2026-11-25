// The progress as a browser keeps it (see Local files in specs.md): under one name, each level by
// its stable name, whether it is done and the code that passed each of its maps, beside the version
// of their shape, `{"levels":{"paint-a-square":{"done":true,"passed":{"1":"forward()\n"}}},"version":1}`.
// A level whose progress can't be read is a level not started; a field that can't be read takes its
// default, and a map whose number or code can't be read is a map not passed.
//
// The shape is a contract between the versions of the website, as the one of the code is
// (lib/code/saved-code.ts): a field added to a level later (the levels opened by a code, step 21f)
// is read alone and takes its default when it is missing, without a new version. A save writes back
// the other levels as they were, and keeps beside the level saved the fields that this version
// doesn't know: a tab still open on the version before drops nothing that a newer one added. The
// store never writes over a newer version (lib/storage/store.ts).

import { type Fields, hasFields, keyOf, type Store } from '#lib/storage/store.ts';
import { NOT_STARTED, type LevelProgress, type Progress } from './progress.ts';

/** The name the progress is saved under. */
const NAME = 'progress';

/** The version of the shape of what is saved. */
const VERSION = 1;

/** The key of `localStorage` that holds the progress: another tab that saves it changes it. */
export const PROGRESS_KEY = keyOf(NAME);

/** What is saved for each level, by its stable name: nothing when it can't be read. */
function savedLevels(store: Store): Fields {
	const levels = store.read(NAME, VERSION)?.levels;
	return hasFields(levels) ? levels : {};
}

/** The number of a map as JSON writes it, a key: from 1, without a sign nor a zero before it. */
const MAP_NUMBER = /^[1-9][0-9]*$/;

/** The maps passed, each with its code: those whose number and code can be read. */
function passedFrom(saved: unknown): ReadonlyMap<number, string> {
	if (!hasFields(saved)) return new Map();
	return new Map(
		Object.entries(saved)
			.filter(
				(entry): entry is [string, string] =>
					MAP_NUMBER.test(entry[0]) && typeof entry[1] === 'string'
			)
			.map(([map, code]) => [Number(map), code])
	);
}

/** The progress of a level as it was saved; a level not started when it can't be read. */
function levelFrom(saved: unknown): LevelProgress {
	if (!hasFields(saved)) return NOT_STARTED;
	return { done: saved.done === true, passed: passedFrom(saved.passed) };
}

/** The progress saved in a store, every level that can't be read left out. */
export function loadProgress(store: Store): Progress {
	return new Map(
		Object.entries(savedLevels(store))
			.filter(([, saved]) => hasFields(saved))
			.map(([level, saved]) => [level, levelFrom(saved)])
	);
}

/**
 * Saves the progress of a level, beside the progress of the others as it was saved, and beside the
 * fields of its own that this version doesn't know.
 */
export function saveLevelProgress(store: Store, level: string, progress: LevelProgress): void {
	const levels = savedLevels(store);
	const saved = levels[level];
	store.write(NAME, VERSION, {
		levels: {
			...levels,
			[level]: {
				...(hasFields(saved) ? saved : {}),
				done: progress.done,
				passed: Object.fromEntries(progress.passed)
			}
		}
	});
}
