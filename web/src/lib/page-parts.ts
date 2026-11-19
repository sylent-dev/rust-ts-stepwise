// What the page itself is filled with when the website is built (see lib/page-fill.ts): the
// texts of its messages, from the translation file, the head of the robot, and the styles that
// draw them. The hook of the build and the tests share it, so that the tests check what ships.

import { logoDisappointedDrawing } from './elements.ts';
import { findMessage } from './i18n.ts';
import type { PageParts } from './page-fill.ts';
import colors from './styles/colors.css?raw';
import screenMessage from './styles/screen-message.css?raw';
import spacing from './styles/spacing.css?raw';
import typography from './styles/typography.css?raw';

export const pageParts: PageParts = {
	text: findMessage,
	drawings: { disappointed: logoDisappointedDrawing },
	// The design tokens that a message uses, then its look: a test checks that none is missing.
	styles: [colors, typography, spacing, screenMessage]
};
