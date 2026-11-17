import { error } from '@sveltejs/kit';
import { levelAt, levels } from '#lib/levels.ts';
import type { EntryGenerator, PageLoad } from './$types';

// One page per level, written when the website is built: `/levels/1`, `/levels/2`…
export const entries: EntryGenerator = () =>
	levels.map(({ number }) => ({ number: String(number) }));

/** The level of the address; an address without level is a page that doesn't exist. */
export const load: PageLoad = ({ params }) => {
	const level = levelAt(levels, params.number);
	if (!level) error(404, 'Not Found');
	return { number: level.number, name: level.name };
};
