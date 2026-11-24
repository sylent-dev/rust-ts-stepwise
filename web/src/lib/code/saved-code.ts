// The code of the levels as a browser keeps it (see Local files in specs.md): under one name, the
// code of each level by its stable name, its text and its breakpoints, beside the version of
// their shape, `{"levels":{"paint-a-square":{"text":"forward()\n","breakpoints":[1]}},"version":1}`;
// the sandbox under its own name, as a level. Each save reads what is there first: another tab that saved the code of
// another level keeps it. A level whose code can't be read opens on its starting code, and the
// code of the others stays where it is.
//
// The shape is a contract between the versions of the website: what a browser keeps outlives a
// new version, and a tab open on the one before goes on saving. A field added to a level later,
// as its breakpoints were (step 19), is read alone and takes its default when it is missing or
// can't be read: no new version. A save writes back the code of the other levels as it was, with the fields that this
// version doesn't know; the level saved is written whole, as this version knows it, so a tab
// open on the version before drops from that level a field that it doesn't know. A new version
// comes only with the reading of the one before it here, since the store gives nothing for
// another version, and the next save would clear the code of every other level; even then, a
// tab still open on the version before reads nothing of the new one and clears it the same way,
// unless the store refuses to write over a newer version (see docs/backlog.md).

import { type Fields, hasFields, type Store } from '#lib/storage/store.ts';
import type { LevelCode } from './code.ts';

/** The name the code of the levels is saved under. */
const NAME = 'code';

/** The version of the shape of what is saved. */
const VERSION = 1;

/** What is saved for each level, by its stable name: nothing when it can't be read. */
function savedLevels(store: Store): Fields {
	const levels = store.read(NAME, VERSION)?.levels;
	return hasFields(levels) ? levels : {};
}

/**
 * The breakpoints saved beside a text, each line once and in order: none when they are missing,
 * as in the code saved before step 19, and only the line numbers when some entries are not.
 */
function savedBreakpoints(saved: unknown): number[] {
	if (!Array.isArray(saved)) return [];
	const lines = saved.filter(
		(line): line is number => typeof line === 'number' && Number.isSafeInteger(line) && line >= 1
	);
	return [...new Set(lines)].sort((first, second) => first - second);
}

/** The code saved for a level, by its stable name; nothing when its text can't be read. */
export function loadCode(store: Store, level: string): LevelCode | undefined {
	const saved = savedLevels(store)[level];
	if (!hasFields(saved) || typeof saved.text !== 'string') return undefined;
	return { text: saved.text, breakpoints: savedBreakpoints(saved.breakpoints) };
}

/** Saves the code of a level, beside the code of the others. */
export function saveCode(store: Store, level: string, code: LevelCode): void {
	store.write(NAME, VERSION, { levels: { ...savedLevels(store), [level]: code } });
}

/** Forgets the code of a level, which opens on its starting code again. */
export function forgetCode(store: Store, level: string): void {
	const others = Object.entries(savedLevels(store)).filter(([name]) => name !== level);
	store.write(NAME, VERSION, { levels: Object.fromEntries(others) });
}
