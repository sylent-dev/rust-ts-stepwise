// What the map draws (see map-view.svelte).

import type { Outcome, World } from '#lib/core.ts';
import type { Motion } from './motion.ts';

/**
 * What the map draws: a world, and the program played on it, if any. A world alone is a map at
 * rest; a `Playback` is a scene as it is.
 */
export interface Scene {
	/** The world at rest, or as the step under way found it. */
	readonly world: World;
	/** The step under way, or the end of the run after its last step, if any. */
	readonly motion?: Motion;
	/** How far the step under way, or the end of the run, has gone, from 0 to 1. */
	readonly progress?: number;
	/** How the run ended, once its last action has ended; nothing until then. */
	readonly outcome?: Outcome;
}
