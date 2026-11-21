// The code of a level as the learner left it (see Code editor in specs.md): it comes back when
// they return to the level, until **Restore starting code** puts the level back in its first
// state. The sandbox keeps its own, as a level. The breakpoints join it with step 19. Nothing here
// knows how it is saved (saved-code.ts).

/** The code of a level as the learner left it. */
export interface LevelCode {
	/** The text of the program. */
	readonly text: string;
}

/** The code that a level opens on: the one the learner left, or its starting code at first. */
export function codeToOpen(saved: LevelCode | undefined, startingCode: string): LevelCode {
	return saved ?? { text: startingCode };
}

/**
 * Whether the code has left the first state of its level, its starting code: **Restore starting
 * code** would then change it. A code that the learner changed, then changed back, hasn't.
 */
export function hasChanged(code: LevelCode, startingCode: string): boolean {
	return code.text !== startingCode;
}
