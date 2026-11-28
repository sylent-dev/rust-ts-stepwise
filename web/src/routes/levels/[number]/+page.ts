import { error } from '@sveltejs/kit';
import { LEVEL_NAMES, levelAt, loadLevels } from '#lib/levels/levels.ts';
import type { EntryGenerator, PageLoad } from './$types';

// One page per level, written when the website is built, before the core reads their order:
// `/levels/1`, `/levels/2`… as many as there are level files.
export const entries: EntryGenerator = () =>
	LEVEL_NAMES.map((_, index) => ({ number: String(index + 1) }));

/**
 * The levels in their order, the level of the address and the text of its file; an address
 * without level is a page that doesn't exist. The page of an error writes its own texts
 * (`+error.svelte`): the one given here is read by no one, and a core or a file that can't load
 * gets the message of the page itself.
 */
export const load: PageLoad = async ({ params }) => {
	const levels = await loadLevels();
	const level = levelAt(levels, params.number);
	if (!level) error(404, 'Not Found');
	return { levels, level, text: await level.file() };
};
