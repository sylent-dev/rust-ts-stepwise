// The script of `src/app.html` that watches the application start, and shows a message of the
// page when it can't (see Error handling in specs.md). It runs before the application and can't
// share its code: these tests run it in a browser made for them.

import { describe, expect, it } from 'vitest';
import page from '../../app.html?raw';
import { pageScripts, runPageScript } from './test-support.ts';

/** The scripts written in the page itself; this one hands `stepwisePage` to the application. */
const script = pageScripts(page).find((text) => text.includes('stepwisePage')) ?? '';

/** An element of the page, as much of it as the script uses. */
function element() {
	const attributes = new Set<string>();
	return {
		setAttribute: (name: string) => void attributes.add(name),
		removeAttribute: (name: string) => void attributes.delete(name),
		has: (name: string) => attributes.has(name),
		textContent: '',
		onclick: () => {}
	};
}

interface Options {
	/** Whether the browser has WebAssembly. */
	webAssembly?: boolean;
	/** Where the files of the website are, as a link of the page resolves it. */
	home?: { host: string; pathname: string };
}

/** A failure as the browser hands it to the page. */
type Reason = { name: string; message: string } | undefined;

/** Opens the page in a browser made for the test, up to the end of its script. */
function openPage({
	webAssembly = true,
	home = { host: 'stepwise.example', pathname: '/' }
}: Options = {}) {
	const elements: Record<string, ReturnType<typeof element>> = {
		'page-old': element(),
		'page-failed': element(),
		'page-address': element(),
		'page-retry': element()
	};
	// The two messages are written hidden.
	elements['page-old']?.setAttribute('hidden');
	elements['page-failed']?.setAttribute('hidden');

	const listeners: Record<string, (event: { error?: Reason; reason?: Reason }) => void> = {};
	const timers = new Map<number, { callback: () => void; delay: number }>();
	let reloads = 0;

	const window: {
		addEventListener: (type: string, listener: (typeof listeners)[string]) => void;
		stepwisePage?: { started(): void; failed(): void };
	} = {
		addEventListener: (type, listener) => {
			listeners[type] = listener;
		}
	};
	const browser = {
		window,
		document: {
			getElementById: (id: string) => elements[id] ?? null,
			createElement: () => ({ href: '', ...home })
		},
		location: { reload: () => void (reloads += 1) },
		setTimeout: (callback: () => void, delay: number) => {
			timers.set(timers.size + 1, { callback, delay });
			return timers.size;
		},
		clearTimeout: (timer: number) => void timers.delete(timer),
		// Named even when it is missing: the script would find the one of Node.js otherwise.
		WebAssembly: webAssembly ? {} : undefined
	};
	runPageScript(script, browser);

	return {
		/** The message that shows: `old`, `failed`, or none. */
		get shown() {
			const names = ['old', 'failed'].filter((name) => !elements[`page-${name}`]?.has('hidden'));
			return names.join('+');
		},
		get address() {
			return elements['page-address']?.textContent;
		},
		get reloads() {
			return reloads;
		},
		/** The delays the page waits for, in milliseconds. */
		get waits() {
			return [...timers.values()].map(({ delay }) => delay);
		},
		/** The browser reads the rest of the page: the application comes after the script. */
		readApplication() {
			const application = element();
			elements['page-application'] = application;
			return application;
		},
		error: (reason: Reason) => listeners.error?.({ error: reason }),
		rejection: (reason: Reason) => listeners.unhandledrejection?.({ reason }),
		/** Time passes: what the page waited for happens. */
		wait() {
			const pending = [...timers.values()];
			timers.clear();
			for (const { callback } of pending) callback();
		},
		started: () => window.stepwisePage?.started(),
		failed: () => window.stepwisePage?.failed(),
		retry: () => elements['page-retry']?.onclick()
	};
}

/** What each browser says of a file of the application that didn't come. */
const MISSING_FILE: [string, string][] = [
	['Chrome', 'Failed to fetch dynamically imported module: https://stepwise.example/_app/start.js'],
	['Firefox', 'error loading dynamically imported module: https://stepwise.example/_app/start.js'],
	['Safari', 'Importing a module script failed.']
];

const unreadable = { name: 'SyntaxError', message: "Unexpected token '?'" };

describe('the script that watches the application start', () => {
	it('is written for an old browser', () => {
		expect(script).not.toBe('');
		expect(script).not.toMatch(/=>|\b(const|let|class)\b|`|\?\.|\?\?|\.\.\.|catch\s*\{/);
	});

	it('shows no message while the application starts, nor once it runs', () => {
		const opened = openPage();
		expect(opened.shown).toBe('');
		opened.started();
		expect(opened.shown).toBe('');
		expect(opened.waits).toEqual([]);
	});

	it('says at once that a browser without WebAssembly is too old, whatever happens next', () => {
		const opened = openPage({ webAssembly: false });
		expect(opened.shown).toBe('old');
		const application = opened.readApplication();
		opened.started();
		opened.failed();
		expect(opened.shown).toBe('old');
		expect(application.has('inert')).toBe(true);
	});

	it.each(MISSING_FILE)(
		'says that Stepwise couldn’t load when a file doesn’t come in %s',
		(_, message) => {
			const opened = openPage();
			const application = opened.readApplication();
			opened.rejection({ name: 'TypeError', message });
			expect(opened.shown).toBe('failed');
			expect(application.has('inert')).toBe(true);
		}
	);

	it('takes its message away when the application runs after all', () => {
		const opened = openPage();
		const application = opened.readApplication();
		opened.rejection({ name: 'TypeError', message: MISSING_FILE[0]?.[1] ?? '' });
		opened.started();
		expect(opened.shown).toBe('');
		expect(application.has('inert')).toBe(false);
	});

	it('waits 3 seconds after an error, then says that the browser is too old', () => {
		const opened = openPage();
		opened.rejection(unreadable);
		expect(opened.shown).toBe('');
		expect(opened.waits).toEqual([3000]);
		opened.wait();
		expect(opened.shown).toBe('old');
	});

	it('waits once, however many errors follow', () => {
		const opened = openPage();
		opened.error(unreadable);
		opened.error(undefined);
		opened.rejection({ name: 'TypeError', message: 'undefined is not a function' });
		expect(opened.waits).toEqual([3000]);
	});

	it('says nothing when the application starts within those 3 seconds', () => {
		const opened = openPage();
		opened.error({ name: 'Error', message: 'an extension of the browser' });
		opened.started();
		expect(opened.waits).toEqual([]);
		opened.wait();
		expect(opened.shown).toBe('');
	});

	it('ignores what goes wrong once the application runs', () => {
		const opened = openPage();
		opened.started();
		opened.error(unreadable);
		opened.rejection({ name: 'TypeError', message: MISSING_FILE[0]?.[1] ?? '' });
		expect(opened.waits).toEqual([]);
		expect(opened.shown).toBe('');
	});

	it('keeps the message of a file that didn’t come when the wait ends', () => {
		const opened = openPage();
		opened.error(unreadable);
		opened.rejection({ name: 'TypeError', message: MISSING_FILE[1]?.[1] ?? '' });
		opened.wait();
		expect(opened.shown).toBe('failed');
	});

	it('takes the message of a browser too old away when the application starts late', () => {
		const opened = openPage();
		opened.error(unreadable);
		opened.wait();
		opened.started();
		expect(opened.shown).toBe('');
	});

	it('says that a file didn’t come even after it said that the browser is too old', () => {
		const opened = openPage();
		opened.error({ name: 'Error', message: 'an extension of the browser' });
		opened.wait();
		opened.rejection({ name: 'TypeError', message: MISSING_FILE[0]?.[1] ?? '' });
		expect(opened.shown).toBe('failed');
	});

	it('shows the message of a file that couldn’t load when the application asks for it', () => {
		const opened = openPage();
		const application = opened.readApplication();
		opened.started();
		opened.failed();
		expect(opened.shown).toBe('failed');
		expect(application.has('inert')).toBe(true);
	});

	// The page of an error asks for it before the root layout says that the application runs:
	// in Svelte, what a component holds is mounted before the component itself.
	it('keeps the message the application asked for, even before it says that it runs', () => {
		const opened = openPage();
		const application = opened.readApplication();
		opened.failed();
		opened.started();
		expect(opened.shown).toBe('failed');
		expect(application.has('inert')).toBe(true);
	});

	it.each([
		[{ host: 'stepwise.example', pathname: '/' }, 'stepwise.example'],
		[{ host: 'name.github.io', pathname: '/rust-ts-stepwise/' }, 'name.github.io/rust-ts-stepwise']
	])('writes the address of the website, %o', (home, address) => {
		expect(openPage({ home }).address).toBe(address);
	});

	it('loads the page again at Try again', () => {
		const opened = openPage();
		opened.retry();
		expect(opened.reloads).toBe(1);
	});
});
