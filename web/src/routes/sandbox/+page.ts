import { sandboxFile } from '#lib/levels.ts';
import type { PageLoad } from './$types';

/**
 * The text of the file of the sandbox. As for a level, a file that can't load gets the message of
 * the page itself.
 */
export const load: PageLoad = async () => ({ text: await sandboxFile() });
