// What the tests of a program being played share: a page whose frames a test draws. Used by the
// tests alone.

import type { Frames } from './playback.svelte.ts';

/** A page that draws a frame when the test says so. */
export interface TestPage {
	/** What a `Playback` asks its frames by. A second request while one waits throws. */
	frames: Frames;
	/** Gives the frame asked its time, in milliseconds; tells whether one was asked. */
	draw(time: number): boolean;
	/** Whether a frame is asked, and not drawn yet. */
	asked(): boolean;
}

/** A page that draws a frame when the test says so, and none by itself. */
export function pageOf(): TestPage {
	let pending: ((time: number) => void) | undefined;
	return {
		frames: (frame) => {
			if (pending) throw new Error('a frame is asked already');
			pending = frame;
			return () => {
				pending = undefined;
			};
		},
		draw: (time) => {
			const frame = pending;
			pending = undefined;
			frame?.(time);
			return frame !== undefined;
		},
		asked: () => pending !== undefined
	};
}
