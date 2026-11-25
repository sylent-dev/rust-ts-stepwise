// The maps of a level (see Variants in specs.md): their numbers, from 1, as their tabs name them,
// and the address that shows one, `/levels/18?map=2`, the first map going without a parameter.

/** The numbers of the `count` maps of a level, from 1, in order. */
export function mapNumbers(count: number): number[] {
	return Array.from({ length: count }, (_, index) => index + 1);
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
	return mapNumbers(count).find((map) => String(map) === asked) ?? 1;
}

/**
 * The query of the address of a level that shows the map numbered `map`, `?map=2`, which the
 * first map goes without: its address is the one of its level.
 */
export function mapQuery(map: number): string {
	return map === 1 ? '' : `?${MAP_PARAMETER}=${String(map)}`;
}
