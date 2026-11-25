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

/** The stable name of the sandbox: the name of its file, and of what is saved for it. */
export const SANDBOX = 'sandbox';

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
		.filter(({ name }) => name !== SANDBOX)
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.map((level, index) => ({ number: index + 1, ...level }));
}

/**
 * The level of an address, `/levels/<number>`. The texts are compared, so the number is the one
 * the interface writes, and nothing else (`01`, `1.0`): a level has one address.
 */
export function levelAt(levels: readonly LevelEntry[], number: string): LevelEntry | undefined {
	return levels.find((level) => String(level.number) === number);
}

/** The parameter of the address of a level that holds the map shown: `/levels/18?map=2`. */
const MAP_PARAMETER = 'map';

/**
 * The map that an address shows, by its number among the `count` maps of its level, as its tab
 * names it: the one of its parameter, written as the interface writes it (`?map=2`, never
 * `?map=02`); the first map without one, or for a map that the level doesn't have (decided on
 * 2026-11-25).
 */
export function mapAt(address: Pick<URL, 'search'>, count: number): number {
	const asked = new URLSearchParams(address.search).get(MAP_PARAMETER);
	const map = Array.from({ length: count }, (_, index) => index + 1).find(
		(number) => String(number) === asked
	);
	return map ?? 1;
}

/**
 * The query of the address of a level that shows the map numbered `map`, `?map=2`, which the
 * first map goes without: its address is the one of its level.
 */
export function mapQuery(map: number): string {
	return map === 1 ? '' : `?${MAP_PARAMETER}=${String(map)}`;
}

/**
 * The way to read the file of the sandbox among `files`, for `new Sandbox(text)`. In a folder
 * without it, the reading fails, as the one of a file that can't load.
 */
export function sandboxIn(files: LevelFiles): () => Promise<string> {
	const file = Object.entries(files).find(([path]) => stableName(path) === SANDBOX)?.[1];
	return file ?? (() => Promise.reject(new Error(`levels: no file ${SANDBOX}.toml`)));
}

/**
 * What every level says, each part in a message of its own. The goal joins the title here with
 * the levels (step 21), which also settle how a part that a level may leave out, as its hint, is
 * named and checked.
 */
export const LEVEL_PARTS = ['title'] as const;

/** A part of what a level says. */
export type LevelPart = (typeof LEVEL_PARTS)[number];

/** The name of the message that holds a part of a level: `level-paint-a-square-title`. */
export function levelMessage(name: string, part: LevelPart): string {
	return `level-${name}-${part}`;
}

// For Vite, a pattern that starts with `/` starts at the root of `web/`, wherever this module
// lives: the folder `web/levels/`, not the addresses `/levels/…` of the website.
const files = import.meta.glob<string>('/levels/*.toml', { query: '?raw', import: 'default' });

/** The levels of the website, in their order. */
export const levels: readonly LevelEntry[] = listLevels(files);

/** Reads the text of the file of the sandbox of the website. */
export const sandboxFile: () => Promise<string> = sandboxIn(files);
