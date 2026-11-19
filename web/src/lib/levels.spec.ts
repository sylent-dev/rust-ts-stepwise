import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	levelAt,
	levels,
	listLevels,
	SANDBOX,
	sandboxFile,
	sandboxIn,
	type LevelFiles
} from './levels.ts';
import { initSync, Level, Sandbox } from '#lib/wasm/stepwise.js';

initSync({ module: readFileSync(new URL('./wasm/stepwise_bg.wasm', import.meta.url)) });

/** A folder of levels whose files hold their own path. */
function folder(...paths: string[]): LevelFiles {
	return Object.fromEntries(paths.map((path) => [path, () => Promise.resolve(path)]));
}

describe('listLevels', () => {
	it('names each level after its file and numbers them from 1, in the order of the names', () => {
		const found = listLevels(folder('../../levels/turn-left.toml', '../../levels/forward.toml'));
		expect(found.map(({ number, name }) => [number, name])).toEqual([
			[1, 'forward'],
			[2, 'turn-left']
		]);
	});

	it('leaves the sandbox out, without a number', () => {
		const found = listLevels(
			folder('levels/forward.toml', 'levels/sandbox.toml', 'levels/turn.toml')
		);
		expect(found.map(({ number, name }) => [number, name])).toEqual([
			[1, 'forward'],
			[2, 'turn']
		]);
	});

	it('keeps the way to read the file of each level', async () => {
		const found = listLevels(folder('levels/turn-left.toml', 'levels/forward.toml'));
		expect(await found[1]?.file()).toBe('levels/turn-left.toml');
	});
});

describe('levelAt', () => {
	const found = listLevels(folder('levels/forward.toml', 'levels/turn-left.toml'));

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
			folder('levels/forward.toml', 'levels/sandbox.toml', 'levels/turn.toml')
		);
		expect(await file()).toBe('levels/sandbox.toml');
	});

	it('fails to read it in a folder without it', async () => {
		await expect(sandboxIn(folder('levels/forward.toml'))()).rejects.toThrow(`${SANDBOX}.toml`);
	});
});

describe('the levels of the website', () => {
	const each = levels.map((level) => [level.name, level] as const);

	// A wrong path of the folder would list no file, without an error.
	it('has at least one level', () => {
		expect(levels.length).toBeGreaterThan(0);
	});

	// What the folder gives is the text of each file, not its address: the core reads it. The
	// content of a level file is checked by the tests of the core.
	it.each(each)('%s reaches the core as the text of its file', async (_name, level) => {
		using read = new Level(await level.file());
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
