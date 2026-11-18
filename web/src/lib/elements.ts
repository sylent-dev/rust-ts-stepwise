// The drawings of the world elements, used as they are: the SVG files of the sheet of step 1, in
// `docs/mockups/world-elements/daylight/` (see World elements in docs/technical-choices.md). This
// module is the one place that knows where they live; each is the address of its file, for an
// `<img>` or an SVG `<image>`.

import eyesDim from '../../../docs/mockups/world-elements/daylight/eyes-dim.svg';
import eyesLit from '../../../docs/mockups/world-elements/daylight/eyes-lit.svg';
import floor from '../../../docs/mockups/world-elements/daylight/floor.svg';
import goalItem from '../../../docs/mockups/world-elements/daylight/goal-item.svg';
import goalMissed from '../../../docs/mockups/world-elements/daylight/goal-missed.svg';
import goalStand from '../../../docs/mockups/world-elements/daylight/goal-stand.svg';
import item from '../../../docs/mockups/world-elements/daylight/item.svg';
import pincer from '../../../docs/mockups/world-elements/daylight/pincer.svg';
import robot from '../../../docs/mockups/world-elements/daylight/robot.svg';
import wallEdge from '../../../docs/mockups/world-elements/daylight/wall-edge.svg';
import wallRim from '../../../docs/mockups/world-elements/daylight/wall-rim.svg';
import wall from '../../../docs/mockups/world-elements/daylight/wall.svg';

export { default as logo } from '../../../docs/mockups/world-elements/daylight/logo.svg';
export { default as logoDisappointed } from '../../../docs/mockups/world-elements/daylight/logo-disappointed.svg';

/**
 * The text of the same file, for the page itself (src/app.html), which writes the drawing in its
 * messages: an image would be one more file to load, where nothing may load.
 */
export { default as logoDisappointedDrawing } from '../../../docs/mockups/world-elements/daylight/logo-disappointed.svg?raw';

/**
 * The drawings that the map stacks in a cell, each a square of 64 units drawn for one cell (see
 * Look of the world in specs.md). The robot looks north; its eyes at the end of a run, its pincer
 * and the item it carries are drawn over it.
 */
export const worldElements = {
	floor,
	wall,
	wallRim,
	wallEdge,
	goalItem,
	goalStand,
	goalMissed,
	item,
	robot,
	pincer,
	eyesLit,
	eyesDim
} as const;

/** The name of a drawing of the map. */
export type WorldElement = keyof typeof worldElements;
