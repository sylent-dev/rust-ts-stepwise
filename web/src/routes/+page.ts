import { loadLevels } from '#lib/levels/levels.ts';
import type { PageLoad } from './$types';

/**
 * The levels in their order, in their chapters, which the core reads. A core that can't load gets
 * the message of the page itself.
 */
export const load: PageLoad = async () => ({ levels: await loadLevels() });
