import { describe, expect, it } from 'vitest';
import { mapAt, mapNumbers, mapQuery } from './level-maps.ts';

describe('mapNumbers', () => {
	it('numbers the maps of a level from 1, in order', () => {
		expect(mapNumbers(3)).toEqual([1, 2, 3]);
		expect(mapNumbers(1)).toEqual([1]);
		expect(mapNumbers(0)).toEqual([]);
	});
});

describe('mapAt', () => {
	const at = (search: string) => new URL(`https://stepwise.example/levels/18${search}`);

	it('gives the map of the parameter, as its tab names it', () => {
		expect(mapAt(at('?map=2'), 3)).toBe(2);
		expect(mapAt(at('?map=3'), 3)).toBe(3);
		expect(mapAt(at('?map=1'), 3)).toBe(1);
	});

	it('gives the first map without a parameter', () => {
		expect(mapAt(at(''), 3)).toBe(1);
		expect(mapAt(at('?speed=5'), 3)).toBe(1);
	});

	it('gives the first map for a map that the level doesn’t have', () => {
		expect(mapAt(at('?map=4'), 3)).toBe(1);
		expect(mapAt(at('?map=0'), 3)).toBe(1);
		expect(mapAt(at('?map=2'), 1)).toBe(1);
		expect(mapAt(at('?map=2'), 0)).toBe(1);
	});

	it('gives the first map for a number written another way: a map has one address', () => {
		for (const map of ['02', '2.0', '2e0', '+2', ' 2', 'two', '']) {
			expect(mapAt(at(`?map=${encodeURIComponent(map)}`), 3), `"${map}"`).toBe(1);
		}
	});
});

describe('mapQuery', () => {
	it('holds the map in its parameter', () => {
		expect(mapQuery(2)).toBe('?map=2');
		expect(mapQuery(3)).toBe('?map=3');
	});

	it('is nothing for the first map, whose address is the one of its level', () => {
		expect(mapQuery(1)).toBe('');
	});

	it('is read back as the map it shows', () => {
		for (const map of [1, 2, 3]) {
			expect(mapAt({ search: mapQuery(map) }, 3)).toBe(map);
		}
	});
});
