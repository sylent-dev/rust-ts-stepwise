// A program played on the map, with its effects run as in a browser (see vitest-node-client.ts):
// what a screen follows of it, and its run freed by the cleanup of an effect, where a signal
// reads as it was before the changes of the batch.

import { flushSync } from 'svelte';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { kept } from '#lib/core/core-ready.svelte.ts';
import { type Run, Sandbox } from '#lib/core/core.ts';
import { corridor, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import { Playback, type PlaybackStatus } from './playback.svelte.ts';

loadTestCore();

/** A corridor of four cells, the robot on the first one, facing east. */
const sandbox = new Sandbox(sandboxOf(corridor('....')));
afterAll(() => {
	sandbox.free();
});

/** The times each run that the test started was freed, in the order they started. */
let freed: number[];
beforeEach(() => {
	freed = [];
});

/** Starts a run of two moves, which counts the times it is freed. */
function start(): Run {
	const run = sandbox.start('forward()\nforward()\n');
	const counts = freed;
	const at = counts.push(0) - 1;
	const free = run.free.bind(run);
	run.free = () => {
		counts[at] = (counts[at] ?? 0) + 1;
		free();
	};
	return run;
}

/** A program at rest in the corridor, whose frames never come. */
function play(): Playback {
	return new Playback({ world: sandbox.world(), start }, { frames: () => () => {} });
}

describe('what a screen follows of a program', () => {
	it('tells an effect that a Step at rest started the program, and that Reset ended it', () => {
		const playback = play();
		const seen: PlaybackStatus[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(playback.status);
			});
		});
		flushSync();
		// Nothing else that `status` reads changes at this Step: neither `running` nor `outcome`.
		playback.step();
		flushSync();
		playback.reset();
		flushSync();
		expect(seen).toEqual(['ready', 'paused', 'ready']);
		leave();
		playback.free();
	});

	it('tells an effect that the program runs, then that it is paused', () => {
		const playback = play();
		const seen: PlaybackStatus[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(playback.status);
			});
		});
		flushSync();
		playback.play();
		flushSync();
		playback.pause();
		flushSync();
		expect(seen).toEqual(['ready', 'running', 'paused']);
		leave();
		playback.free();
	});
});

describe('the run of a program kept for a screen', () => {
	/**
	 * A screen that keeps a program for the map it shows, as the level screen does: another map
	 * makes another program, and the one before is freed by the cleanup of an effect.
	 */
	function screen(): {
		program: () => Playback | undefined;
		showAnotherMap: () => void;
		leave: () => void;
	} {
		let map = $state(1);
		let program: { readonly current: Playback | undefined } | undefined;
		const leave = $effect.root(() => {
			program = kept(() => (map > 0 ? play() : undefined));
		});
		flushSync();
		return {
			program: () => program?.current,
			showAnotherMap: () => {
				map += 1;
			},
			leave
		};
	}

	it('is freed once when another map takes the place of its program', () => {
		const shown = screen();
		shown.program()?.step();
		flushSync();
		shown.showAnotherMap();
		flushSync();
		expect(freed).toEqual([1]);
		shown.leave();
	});

	it('is freed once when the program starts and another map comes before the screen follows', () => {
		const shown = screen();
		shown.program()?.step();
		shown.showAnotherMap();
		flushSync();
		expect(freed).toEqual([1]);
		shown.leave();
	});

	it('is freed once, never twice, when Reset and another map come before the screen follows', () => {
		const shown = screen();
		shown.program()?.step();
		flushSync();
		shown.program()?.reset();
		shown.showAnotherMap();
		expect(() => {
			flushSync();
		}).not.toThrow();
		expect(freed).toEqual([1]);
		shown.leave();
	});

	it('is freed once when the screen leaves before it follows a Step or a Reset', () => {
		const stepped = screen();
		stepped.program()?.step();
		stepped.leave();
		expect(freed).toEqual([1]);

		const reset = screen();
		reset.program()?.step();
		flushSync();
		reset.program()?.reset();
		expect(() => {
			reset.leave();
		}).not.toThrow();
		expect(freed).toEqual([1, 1]);
	});
});
