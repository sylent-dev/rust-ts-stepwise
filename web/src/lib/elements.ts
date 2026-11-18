// The drawings of the world elements, used as they are: the SVG files of the sheet of step 1, in
// `docs/mockups/world-elements/daylight/` (see World elements in docs/technical-choices.md). This
// module is the one place that knows where they live; each is the address of its file, for an
// `<img>`.

export { default as logo } from '../../../docs/mockups/world-elements/daylight/logo.svg';
export { default as logoDisappointed } from '../../../docs/mockups/world-elements/daylight/logo-disappointed.svg';

/**
 * The text of the same file, for the page itself (src/app.html), which writes the drawing in its
 * messages: an image would be one more file to load, where nothing may load.
 */
export { default as logoDisappointedDrawing } from '../../../docs/mockups/world-elements/daylight/logo-disappointed.svg?raw';
