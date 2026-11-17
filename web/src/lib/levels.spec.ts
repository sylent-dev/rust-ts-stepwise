import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import english from '../../locales/en.ftl?raw';
import { createBundle } from './i18n.ts';
import { levelAt, levels, listLevels, titleMessage, type LevelFiles } from './levels.ts';
import { initSync, Level } from '#lib/wasm/stepwise.js';

initSync({ module: readFileSync(new URL('./wasm/stepwise_bg.wasm', import.meta.url)) });

/** A folder of levels whose files hold their own path. */
function folder(...paths: string[]): LevelFiles {
	return Object.fromEntries(paths.map((path) => [path, () => Promise.resolve(path)]));
}

describe('listLevels', () => {
	const found = listLevels(
		folder('../../levels/turn-left.toml', '../../levels/sandbox.toml', '../../levels/forward.toml')
	);

	it('names each level after its file and numbers them from 1, in the order of the names', () => {
		expect(found.map(({ number, name }) => [number, name])).toEqual([
			[1, 'forward'],
			[2, 'turn-left']
		]);
	});

	it('leaves the sandbox out', () => {
		expect(found.map(({ name }) => name)).not.toContain('sandbox');
	});

	it('keeps the way to read the file of each level', async () => {
		expect(await found[1]?.file()).toBe('../../levels/turn-left.toml');
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
		for (const number of ['01', '1.0', '1e0', '+1', '-1', ' 1', '1 ', 'one', '']) {
			expect(levelAt(found, number), `"${number}"`).toBeUndefined();
		}
	});
});

describe('the levels of the website', () => {
	const { bundle } = createBundle('en', english);

	it('has at least one level', () => {
		expect(levels.length).toBeGreaterThan(0);
	});

	it.each(levels.map((level) => [level.name, level] as const))(
		'%s is read by the core and has its title',
		async (name, level) => {
			using read = new Level(await level.file());
			expect(read.maps().length).toBeGreaterThan(0);
			expect(bundle.hasMessage(titleMessage(name)), titleMessage(name)).toBe(true);
		}
	);
});
