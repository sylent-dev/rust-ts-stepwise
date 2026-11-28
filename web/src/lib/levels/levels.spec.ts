import { describe, expect, it } from 'vitest';
import { chapters, Level, Sandbox } from '#lib/core/core.ts';
import { levelFile, loadTestCore } from '#lib/core/test-support.ts';
import {
	CHAPTERS,
	inChapters,
	LEVEL_NAMES,
	levelAt,
	levelNames,
	listLevels,
	readLevels,
	SANDBOX,
	sandboxFile,
	sandboxIn,
	type LevelFiles
} from './levels.ts';

loadTestCore();

/** A folder of levels whose files hold their own path. */
function folder(...paths: string[]): LevelFiles {
	return Object.fromEntries(paths.map((path) => [path, () => Promise.resolve(path)]));
}

/** Two chapters of the tests, by the stable names of their levels. */
const TWO_CHAPTERS = [
	{ name: 'first-steps', levels: ['turn-left', 'forward'] },
	{ name: 'repeat', levels: ['again'] }
];

describe('listLevels', () => {
	const files = folder('/levels/forward.toml', '/levels/again.toml', '/levels/turn-left.toml');

	it('numbers the levels from 1 in the order of the chapters, across them', () => {
		const found = listLevels(files, TWO_CHAPTERS);
		expect(found.map(({ number, name, chapter }) => [number, name, chapter])).toEqual([
			[1, 'turn-left', 'first-steps'],
			[2, 'forward', 'first-steps'],
			[3, 'again', 'repeat']
		]);
	});

	it('keeps the way to read the file of each level', async () => {
		const found = listLevels(files, TWO_CHAPTERS);
		expect(await found[1]?.file()).toBe('/levels/forward.toml');
	});

	it('gives a level listed without a file a file that fails to load', async () => {
		const found = listLevels(folder('/levels/forward.toml'), [
			{ name: 'first-steps', levels: ['forward', 'lost'] }
		]);
		expect(found.map(({ number, name }) => [number, name])).toEqual([
			[1, 'forward'],
			[2, 'lost']
		]);
		await expect(found[1]?.file()).rejects.toThrow('lost.toml');
	});

	it('gives no number to a file that no chapter lists', () => {
		const found = listLevels(files, [{ name: 'repeat', levels: ['again'] }]);
		expect(found.map(({ name }) => name)).toEqual(['again']);
	});
});

describe('levelNames', () => {
	it('names the levels of a folder after their files, without the sandbox and the chapters', () => {
		const names = levelNames(
			folder(
				'/levels/turn.toml',
				`/levels/${SANDBOX}.toml`,
				`/levels/${CHAPTERS}.toml`,
				'/levels/forward.toml'
			)
		);
		expect(names).toEqual(['forward', 'turn']);
	});
});

describe('readLevels', () => {
	it('lists the levels in the order of the file of the chapters, which the core reads', async () => {
		const files = {
			...folder('/levels/forward.toml', '/levels/again.toml', '/levels/turn-left.toml'),
			'/levels/chapters.toml': () =>
				Promise.resolve(
					"version = 1\n[[chapters]]\nname = 'repeat'\nlevels = ['again', 'forward']\n"
				)
		};
		const found = await readLevels(files);
		expect(found.map(({ number, name }) => [number, name])).toEqual([
			[1, 'again'],
			[2, 'forward']
		]);
	});

	it('fails without the file of the chapters', async () => {
		await expect(readLevels(folder('/levels/forward.toml'))).rejects.toThrow('chapters.toml');
	});
});

describe('inChapters', () => {
	it('groups the levels by their chapters, each in its order', () => {
		const files = folder('/levels/forward.toml', '/levels/again.toml', '/levels/turn-left.toml');
		const grouped = inChapters(listLevels(files, TWO_CHAPTERS));
		expect(grouped.map(({ chapter, levels }) => [chapter, levels.map(({ name }) => name)])).toEqual(
			[
				['first-steps', ['turn-left', 'forward']],
				['repeat', ['again']]
			]
		);
	});

	it('gives no chapter without a level', () => {
		expect(inChapters([])).toEqual([]);
	});
});

describe('levelAt', () => {
	const found = listLevels(folder('/levels/forward.toml', '/levels/turn-left.toml'), [
		{ name: 'first-steps', levels: ['forward', 'turn-left'] }
	]);

	it('gives the level of a number', () => {
		expect(levelAt(found, '1')?.name).toBe('forward');
		expect(levelAt(found, '2')?.name).toBe('turn-left');
	});

	it('gives nothing for a number without level', () => {
		expect(levelAt(found, '0')).toBeUndefined();
		expect(levelAt(found, '3')).toBeUndefined();
		expect(levelAt(found, '99999999999999999999')).toBeUndefined();
	});

	it('gives nothing for a number written another way: a level has one address', () => {
		for (const number of ['01', '1.0', '1e0', '0x1', '0b1', '+1', '-1', ' 1', '1 ', 'one', '']) {
			expect(levelAt(found, number), `"${number}"`).toBeUndefined();
		}
	});
});

describe('sandboxIn', () => {
	it('gives the way to read the file of the sandbox, among those of the levels', async () => {
		const file = sandboxIn(
			folder('/levels/forward.toml', '/levels/sandbox.toml', '/levels/turn.toml')
		);
		expect(await file()).toBe('/levels/sandbox.toml');
	});

	it('fails to read it in a folder without it', async () => {
		await expect(sandboxIn(folder('/levels/forward.toml'))()).rejects.toThrow(`${SANDBOX}.toml`);
	});
});

describe('the levels of the website', () => {
	const listed = listLevels(
		Object.fromEntries(LEVEL_NAMES.map((name) => [name, () => Promise.resolve(levelFile(name))])),
		chapters(levelFile(CHAPTERS))
	);

	// A wrong path of the folder would list no file, without an error.
	it('has at least one level, each in the list of the chapters', () => {
		expect(LEVEL_NAMES.length).toBeGreaterThan(0);
		expect(listed.map(({ name }) => name).sort()).toEqual([...LEVEL_NAMES]);
	});

	// What the folder gives is the text of each file, not its address: the core reads it. The
	// content of a level file is checked by the tests of the core.
	it.each(LEVEL_NAMES)('%s reaches the core as the text of its file', (name) => {
		using read = new Level(levelFile(name));
		expect(read.maps().length).toBeGreaterThan(0);
	});
});

describe('the sandbox of the website', () => {
	// A wrong path of the folder would give no file, and the sandbox a page that can't load.
	it('reaches the core as the text of its file', async () => {
		using read = new Sandbox(await sandboxFile());
		expect(read.world().width).toBeGreaterThan(0);
	});
});
