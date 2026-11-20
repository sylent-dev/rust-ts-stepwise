// What the application tells the page that holds it (src/app.html), and what it remembers of it.
// While the application starts, the page watches: a browser that can't run it never reaches this
// module, so the page itself says so, with messages of its own (see Error handling in specs.md).

/**
 * Whether the application asked the page for its message. The page keeps that message until it
 * is loaded again, so this never goes back. The page may also keep a message of its own, in a
 * browser without WebAssembly: the application is then out of reach from its start, and nothing
 * tells it so unless it asks for its core.
 */
let failed = $state(false);

/** The application runs: the page stops watching, and takes away a message shown too soon. */
export function applicationStarted(): void {
	window.stepwisePage?.started();
}

/**
 * A file of Stepwise couldn't load once the application runs (its core), or the application met
 * an error it didn't foresee: the page shows its message, with **Try again**, which loads the
 * page again.
 */
export function loadFailed(): void {
	failed = true;
	window.stepwisePage?.failed();
}

/** The page, as the application left it. */
export const currentPage = {
	/**
	 * Whether the application asked for its message, which took the place of the application for
	 * good. The page puts the application out of reach under it, but for what the browser draws
	 * over everything, a panel: that one follows this, and closes.
	 */
	get failed(): boolean {
		return failed;
	}
};
