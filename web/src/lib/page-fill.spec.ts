import { describe, expect, it } from 'vitest';
import page from '../app.html?raw';
import { t } from './i18n.ts';
import { fillPage, type PageParts } from './page-fill.ts';
import { pageParts } from './page-parts.ts';
import screenMessage from './styles/screen-message.css?raw';

const texts: Record<string, string> = { greeting: 'Hello', order: 'a < b & b > c' };

const parts: PageParts = {
	text: (name) => texts[name],
	drawings: { head: '<svg viewBox="0 0 1 1"><path d="M0 0" /></svg>\n' },
	styles: ['/* The tokens. */\n:root {\n\t--gap: 4px;\n}\n', 'p {\n\tmargin: 0; /* none */\n}\n']
};

describe('fillPage', () => {
	it('writes the text of a message', () => {
		expect(fillPage('<h1>%stepwise.text.greeting%</h1>', parts)).toBe('<h1>Hello</h1>');
	});

	it('writes a text as HTML does', () => {
		expect(fillPage('<p>%stepwise.text.order%</p>', parts)).toBe('<p>a &lt; b &amp; b &gt; c</p>');
	});

	it('writes a drawing as it is', () => {
		expect(fillPage('<div>%stepwise.drawing.head%</div>', parts)).toBe(
			'<div><svg viewBox="0 0 1 1"><path d="M0 0" /></svg></div>'
		);
	});

	it('writes the style sheets in their order, without their comments nor their line breaks', () => {
		expect(fillPage('<head>%stepwise.styles%</head>', parts)).toBe(
			'<head><style>:root { --gap: 4px; } p { margin: 0; }</style></head>'
		);
	});

	it('fills every place of a page', () => {
		expect(
			fillPage('%stepwise.text.greeting%, %stepwise.text.greeting% %stepwise.drawing.head%', parts)
		).toBe('Hello, Hello <svg viewBox="0 0 1 1"><path d="M0 0" /></svg>');
	});

	it('leaves what it doesn’t fill to SvelteKit', () => {
		expect(fillPage('%sveltekit.head% %stepwise.text.greeting%', parts)).toBe(
			'%sveltekit.head% Hello'
		);
	});

	it.each([
		['a message that doesn’t exist', '%stepwise.text.farewell%'],
		['a drawing that doesn’t exist', '%stepwise.drawing.tail%'],
		['a kind it doesn’t know', '%stepwise.sound.bump%'],
		['a kind without a name', '%stepwise.text%'],
		['styles with a name', '%stepwise.styles.colors%'],
		['a name with a capital', '%stepwise.text.Greeting%'],
		['a name with an underscore', '%stepwise.text.gree_ting%'],
		['a name in two parts', '%stepwise.text.greeting.again%'],
		['a place without a kind', '%stepwise.%']
	])('stops for %s', (_, place) => {
		expect(() => fillPage(`<p>${place}</p>`, parts)).toThrow(place);
	});
});

describe('the page', () => {
	// The build fills the page with the same parts (src/hooks.server.ts), and fails for a hole:
	// this test says what is missing before the build does.
	it('is filled whole with what the build hands it', () => {
		const filled = fillPage(page, pageParts);
		expect(filled).not.toContain('%stepwise.');
		expect(filled).toContain(`<title>${t('app-name')}</title>`);
		expect(filled).toContain(t('page-old-title'));
		expect(filled).toContain('<svg');
	});

	// The styles of the application fill the gap on a page that loads: a token missing from the
	// page would only show where nothing else could load, which no one tries.
	it('carries every design token that the look of a message uses', () => {
		const carried = pageParts.styles.join('\n');
		const used = new Set(
			[...screenMessage.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1])
		);
		expect(used.size).toBeGreaterThan(0);
		for (const token of used) expect(carried, token).toContain(`${token}:`);
	});
});
