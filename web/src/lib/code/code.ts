// The code of a level as the learner left it (see Code editor in specs.md): its text and its
// breakpoints, which come back when they return to the level, until **Restore starting code**
// puts the level back in its first state. The sandbox keeps its own, as a level. Nothing here
// knows how it is saved (saved-code.ts).

/** The code of a level as the learner left it. */
export interface LevelCode {
	/** The text of the program. */
	readonly text: string;
	/**
	 * The lines that hold a breakpoint, by their number from 1, in order and each once. A
	 * breakpoint belongs to a line of the text: it never outlives it.
	 */
	readonly breakpoints: readonly number[];
}

/**
 * The code that a level opens on: the one the learner left, or its starting code at first,
 * without breakpoints.
 */
export function codeToOpen(saved: LevelCode | undefined, startingCode: string): LevelCode {
	return saved ?? { text: startingCode, breakpoints: [] };
}

/**
 * Whether the code differs from the first state of its level, its starting code without
 * breakpoints: **Restore starting code** would then change it. A code that the learner changed,
 * then changed back, is the starting code again.
 */
export function differsFromStart(code: LevelCode, startingCode: string): boolean {
	return code.text !== startingCode || code.breakpoints.length > 0;
}
