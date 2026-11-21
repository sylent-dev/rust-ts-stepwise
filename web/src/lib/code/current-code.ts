// The code of the levels in this browser (see saved-code.ts): read when a level opens, saved at
// each change, without a button to save. It holds no state of its own: the code shown is the
// one of the editor.

import { store } from '#lib/storage/browser-store.svelte.ts';
import { codeToOpen, type LevelCode } from './code.ts';
import { forgetCode, loadCode, saveCode } from './saved-code.ts';

/** The code that a level opens on, by its stable name: the one saved, or its starting code. */
export function openingCode(level: string, startingCode: string): LevelCode {
	return codeToOpen(loadCode(store, level), startingCode);
}

/** Keeps the code of a level, as the learner changes it. */
export function keepCode(level: string, code: LevelCode): void {
	saveCode(store, level, code);
}

/** Puts a level back in its first state: it opens on its starting code again. */
export function restoreCode(level: string): void {
	forgetCode(store, level);
}
