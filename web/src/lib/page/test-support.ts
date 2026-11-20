// What the tests of the page itself (`src/app.html`) share. Used by the tests alone.

/**
 * Runs a script written in the page itself, in a browser made for a test. The script names
 * `localStorage`, `document` and the like as a page does: they are looked up in `browser` first,
 * so that a test hands the ones it wants, and one that throws when it is asked for.
 */
export function runPageScript(script: string, browser: object): void {
	// eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call -- the text is a script of the page, read from its file: a test runs it as a browser would
	new Function('browser', `with (browser) { ${script} }`)(browser);
}
