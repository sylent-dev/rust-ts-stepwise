// The levels of the website: the files of `web/levels/`, each named after the stable name of its
// level, in kebab-case, and their order, in their chapters, which `chapters.toml` lists (see Levels
// in docs/technical-choices.md). The core reads that list, so the levels are known once it has
// loaded. The sandbox lives in the same folder and is not a level.

import { chapters as readChapters, loadCore, type Chapter } from '#lib/core/core.ts';

/** A level of the website. */
export interface LevelEntry {
	/**
	 * Its number, from 1: its place among the levels, across the chapters, as the interface writes
	 * it and as its address holds it (`/levels/18`). Computed from the order, never saved.
	 */
	number: number;
	/** Its stable name: the name of its file, of its messages and of what is saved for it. */
	name: string;
	/** The stable name of its chapter: the name of the messages of the chapter. */
	chapter: string;
	/** Reads the text of its file, for `new Level(text)`. */
	file: () => Promise<string>;
}

/** The files of a folder of levels as Vite lists them: a way to read each, by its path. */
export type LevelFiles = Record<string, () => Promise<string>>;

/** The stable name of the sandbox: the name of its file, and of what is saved for it. */
export const SANDBOX = 'sandbox';

/** The name of the file of the chapters, which lists the levels in their order. */
export const CHAPTERS = 'chapters';

/** The name of a file without its folder nor its extension. */
function stableName(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1).replace(/\.toml$/, '');
}

/**
 * The way to read the file of `name` among `files`. In a folder without it, the reading fails, as
 * the one of a file that can't load.
 */
function fileIn(files: LevelFiles, name: string): () => Promise<string> {
	const file = Object.entries(files).find(([path]) => stableName(path) === name)?.[1];
	return file ?? (() => Promise.reject(new Error(`levels: no file ${name}.toml`)));
}

/**
 * The stable names of the levels of `files`, in the order of the names: neither the sandbox nor
 * the chapters.
 */
export function levelNames(files: LevelFiles): string[] {
	return Object.keys(files)
		.map(stableName)
		.filter((name) => name !== SANDBOX && name !== CHAPTERS)
		.sort();
}

/**
 * The levels of `files`, in the order of `chapters`, numbered from 1 across the chapters. A level
 * listed without a file can't load, and a file that no chapter lists has no number: the tests of
 * the core hold that the list names each file once (`crates/core/tests/level_files.rs`).
 */
export function listLevels(files: LevelFiles, chapters: readonly Chapter[]): LevelEntry[] {
	return chapters
		.flatMap(({ name: chapter, levels }) =>
			levels.map((name) => ({ name, chapter, file: fileIn(files, name) }))
		)
		.map((level, index) => ({ number: index + 1, ...level }));
}

/** The levels of a chapter, in their order. */
export interface ChapterLevels {
	/** The stable name of the chapter. */
	chapter: string;
	levels: LevelEntry[];
}

/** The levels, in their order, grouped by their chapters, in their order. */
export function inChapters(levels: readonly LevelEntry[]): ChapterLevels[] {
	const chapters: ChapterLevels[] = [];
	for (const level of levels) {
		const last = chapters.at(-1);
		if (last?.chapter === level.chapter) last.levels.push(level);
		else chapters.push({ chapter: level.chapter, levels: [level] });
	}
	return chapters;
}

/** Loads the core, then reads the chapters of `files` and lists their levels. */
export async function readLevels(files: LevelFiles): Promise<LevelEntry[]> {
	await loadCore();
	return listLevels(files, readChapters(await fileIn(files, CHAPTERS)()));
}

/**
 * The level of an address, `/levels/<number>`. The texts are compared, so the number is the one
 * the interface writes, and nothing else (`01`, `1.0`): a level has one address.
 */
export function levelAt(levels: readonly LevelEntry[], number: string): LevelEntry | undefined {
	return levels.find((level) => String(level.number) === number);
}

/**
 * The way to read the file of the sandbox among `files`, for `new Sandbox(text)`. In a folder
 * without it, the reading fails, as the one of a file that can't load.
 */
export function sandboxIn(files: LevelFiles): () => Promise<string> {
	return fileIn(files, SANDBOX);
}

/**
 * What every level says, each part in a message of its own. The goal joins the title with the
 * bubble of the goal (step 21c), which also settles how a part that a level may leave out, as its
 * hint, is named and checked.
 */
export const LEVEL_PARTS = ['title'] as const;

/** A part of what a level says. */
export type LevelPart = (typeof LEVEL_PARTS)[number];

/** The name of the message that holds a part of a level: `level-paint-a-square-title`. */
export function levelMessage(name: string, part: LevelPart): string {
	return `level-${name}-${part}`;
}

/**
 * What every chapter says, each part in a message of its own: its title, in the header of its
 * levels. Its idea joins it with the home screen (step 21f).
 */
export const CHAPTER_PARTS = ['title'] as const;

/** A part of what a chapter says. */
export type ChapterPart = (typeof CHAPTER_PARTS)[number];

/** The name of the message that holds a part of a chapter: `chapter-functions-title`. */
export function chapterMessage(name: string, part: ChapterPart): string {
	return `chapter-${name}-${part}`;
}

// For Vite, a pattern that starts with `/` starts at the root of `web/`, wherever this module
// lives: the folder `web/levels/`, not the addresses `/levels/…` of the website.
const files = import.meta.glob<string>('/levels/*.toml', { query: '?raw', import: 'default' });

/**
 * The stable names of the levels of the website, in the order of the names: as many as their list
 * numbers, since it names each file once. Known before the core loads, they give the pages of the
 * levels written when the website is built.
 */
export const LEVEL_NAMES: readonly string[] = levelNames(files);

/** The levels of the website once read, or being read. */
let reading: Promise<readonly LevelEntry[]> | undefined;

/**
 * The levels of the website, in their order: read once, as the core has loaded. A core that can't
 * load fails it, and the page says so.
 */
export function loadLevels(): Promise<readonly LevelEntry[]> {
	reading ??= readLevels(files);
	return reading;
}

/** Reads the text of the file of the sandbox of the website. */
export const sandboxFile: () => Promise<string> = sandboxIn(files);
