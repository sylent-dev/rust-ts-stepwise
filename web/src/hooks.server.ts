// Every page of the website is written when it is built. This hook fills what the page itself
// holds (src/app.html): the texts of its messages, from the translation file, the head of the
// robot, and the styles that draw them, the design tokens with the look of a message. A browser
// where the application can't start, or where nothing else could load, shows them all the same
// (see Error handling in specs.md).

import type { Handle } from '@sveltejs/kit/hooks';
import { logoDisappointedDrawing } from '#lib/elements.ts';
import { hasMessage, t } from '#lib/i18n.ts';
import { fillPage, type PageParts } from '#lib/page-fill.ts';
import colors from '#lib/styles/colors.css?raw';
import screenMessage from '#lib/styles/screen-message.css?raw';
import spacing from '#lib/styles/spacing.css?raw';
import typography from '#lib/styles/typography.css?raw';

const parts: PageParts = {
	text: (name) => (hasMessage(name) ? t(name) : undefined),
	drawings: { disappointed: logoDisappointedDrawing },
	// The tokens a message uses, then its look.
	styles: [colors, typography, spacing, screenMessage]
};

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => fillPage(html, parts) });
