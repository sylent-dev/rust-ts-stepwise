// What the page itself is filled with when the website is built (see page-fill.ts): the
// texts of its messages, from the translation file, the head of the robot, and the styles that
// draw them. The hook of the build and the tests share it, so that the tests check what ships.

import { logoDisappointedDrawing } from '#lib/elements.ts';
import { findMessage } from '#lib/i18n.ts';
import button from '#lib/styles/button.css?raw';
import colors from '#lib/styles/colors.css?raw';
import layout from '#lib/styles/layout.css?raw';
import screenMessage from '#lib/styles/screen-message.css?raw';
import spacing from '#lib/styles/spacing.css?raw';
import typography from '#lib/styles/typography.css?raw';
import type { PageParts } from './page-fill.ts';

export const pageParts: PageParts = {
	text: findMessage,
	drawings: { disappointed: logoDisappointedDrawing },
	// The design tokens that a message uses, then its look: a test checks that none is missing.
	styles: [colors, typography, spacing, layout, button, screenMessage]
};
