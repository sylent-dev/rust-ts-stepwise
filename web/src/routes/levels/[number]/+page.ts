import { error } from '@sveltejs/kit';
import { levelAt, levels } from '#lib/levels/levels.ts';
import type { EntryGenerator, PageLoad } from './$types';

// One page per level, written when the website is built: `/levels/1`, `/levels/2`…
export const entries: EntryGenerator = () =>
	levels.map(({ number }) => ({ number: String(number) }));

/**
 * The level of the address, with the text of its file; an address without level is a page that
 * doesn't exist. The page of an error writes its own texts (`+error.svelte`): the one given here
 * is read by no one, and a file that can't load gets the message of the page itself.
 */
export const load: PageLoad = async ({ params }) => {
	const level = levelAt(levels, params.number);
	if (!level) error(404, 'Not Found');
	return { number: level.number, name: level.name, text: await level.file() };
};
