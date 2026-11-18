// What the application tells the page that holds it (src/app.html). While the application
// starts, the page watches: a browser that can't run it never reaches this module, so the page
// itself says so, with messages of its own (see Error handling in specs.md).

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
	window.stepwisePage?.failed();
}
