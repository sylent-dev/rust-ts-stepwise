// The levels of the website: the files of `web/levels/`, each named after the stable name of its
// level, in kebab-case (see Levels in docs/technical-choices.md). The sandbox lives in the same
// folder and is not a level.

/** A level of the website. */
export interface LevelEntry {
	/**
	 * Its number, from 1: its place among the levels, as the interface writes it and as its
	 * address holds it (`/levels/18`). Computed from the order, never saved.
	 */
	number: number;
	/** Its stable name: the name of its file, of its messages and of what is saved for it. */
	name: string;
	/** Reads the text of its file, for `new Level(text)`. */
	file: () => Promise<string>;
}

/** The files of a folder of levels as Vite lists them: a way to read each, by its path. */
export type LevelFiles = Record<string, () => Promise<string>>;

/** The name of a file without its folder nor its extension. */
function stableName(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1).replace(/\.toml$/, '');
}

/**
 * The levels of `files`, in their order. Until the list of the chapters gives it (step 21), the
 * order is the one of the names of the files.
 */
export function listLevels(files: LevelFiles): LevelEntry[] {
	return Object.entries(files)
		.map(([path, file]) => ({ name: stableName(path), file }))
		.filter(({ name }) => name !== 'sandbox')
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.map((level, index) => ({ number: index + 1, ...level }));
}

/**
 * The level of an address, `/levels/<number>`. The number is written as the interface writes it,
 * in digits without a leading zero, so that a level has one address.
 */
export function levelAt(levels: readonly LevelEntry[], number: string): LevelEntry | undefined {
	return /^[1-9][0-9]*$/.test(number) ? levels[Number(number) - 1] : undefined;
}

/** The name of the message that holds the title of a level: `level-paint-a-square-title`. */
export function titleMessage(name: string): string {
	return `level-${name}-title`;
}

/** The levels of the website, in their order. */
export const levels: readonly LevelEntry[] = listLevels(
	import.meta.glob<string>('../../levels/*.toml', { query: '?raw', import: 'default' })
);
