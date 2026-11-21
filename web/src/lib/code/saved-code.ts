// The code of the levels as a browser keeps it (see Local files in specs.md): under one name, the
// code of each level by its stable name, beside the version of their shape,
// `{"levels":{"paint-a-square":{"text":"forward()\n"}},"version":1}`; the sandbox under its own
// name, as a level. Each save reads what is there first: another tab that saved the code of
// another level keeps it. A level whose code can't be read opens on its starting code, and the
// code of the others stays where it is.

import { hasFields, type Saved, type Store } from '#lib/storage/store.ts';
import type { LevelCode } from './code.ts';

/** The name the code of the levels is saved under. */
const NAME = 'code';

/** The version of the shape of what is saved. */
const VERSION = 1;

/** What is saved for each level, by its stable name: nothing when it can't be read. */
function savedLevels(store: Store): Saved {
	const levels = store.read(NAME, VERSION)?.levels;
	return hasFields(levels) ? levels : {};
}

/** The code saved for a level, by its stable name; nothing when none can be read. */
export function loadCode(store: Store, level: string): LevelCode | undefined {
	const saved = savedLevels(store)[level];
	return hasFields(saved) && typeof saved.text === 'string' ? { text: saved.text } : undefined;
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
