// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		/**
		 * What the script of the page (src/app.html) hands to the application; see
		 * src/lib/page/startup.svelte.ts, the one module that calls it.
		 */
		stepwisePage?: {
			/** The application runs. */
			started(): void;
			/** A file of Stepwise couldn't load. */
			failed(): void;
		};
	}
}

export {};
