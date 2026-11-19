// Every page of the website is written when it is built. This hook fills what the page itself
// holds (src/app.html): the texts of its messages, the head of the robot, and the styles that
// draw them, the design tokens with the look of a message (lib/page/page-parts.ts). A browser
// where the application can't start, or where nothing else could load, shows them all the same
// (see Error handling in specs.md).

import type { Handle } from '@sveltejs/kit/hooks';
import { fillPage } from '#lib/page/page-fill.ts';
import { pageParts } from '#lib/page/page-parts.ts';

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => fillPage(html, pageParts) });
