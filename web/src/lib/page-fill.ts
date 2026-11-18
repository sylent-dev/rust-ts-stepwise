// What the page itself holds (src/app.html), filled when the website is built: a browser where
// the application can't start still gets a message, with its texts, its drawing and its look.
// The template names what it needs, and src/hooks.server.ts hands it to `fillPage`:
//
// - `%stepwise.text.<name>%`: the text of a message of the interface;
// - `%stepwise.drawing.<name>%`: a drawing, written as it is;
// - `%stepwise.styles%`: the style sheets the page carries, in a `<style>`.

/** What a page is filled with. */
export interface PageParts {
	/** The text of a message of the interface; nothing for a name it doesn't know. */
	text: (name: string) => string | undefined;
	/** The drawings by their names, each the text of an SVG file. */
	drawings: Readonly<Record<string, string>>;
	/** The style sheets the page carries, in their order. */
	styles: readonly string[];
}

/** A text as HTML writes it. */
function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A style sheet without its comments nor its line breaks: the page is read by no one. */
function compactCss(css: string): string {
	return css
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Fills what `template` names. A name that nothing answers stops the build: a page never ships
 * with a hole.
 */
export function fillPage(template: string, parts: PageParts): string {
	return template.replace(/%stepwise\.([a-z]+)(?:\.([a-z0-9-]+))?%/g, (place, kind, name) => {
		if (kind === 'styles' && name === undefined) {
			return `<style>${parts.styles.map(compactCss).join(' ')}</style>`;
		}
		const filled =
			kind === 'text'
				? parts.text(name)
				: kind === 'drawing'
					? parts.drawings[name]?.trim()
					: undefined;
		if (filled === undefined) throw new Error(`app.html: nothing to fill ${place} with`);
		return kind === 'text' ? escapeHtml(filled) : filled;
	});
}
