import { describe, expect, it } from 'vitest';
import { playSound, VOLUME, type Sound } from './recipes.ts';
import { FakeAudioContext, heardIn, typedNode, type FakeGain } from './test-support.ts';

/** What `sound` starts, played into a node of a new context from 2 seconds on its clock. */
function played(sound: Sound) {
	const context = new FakeAudioContext();
	const out = context.createGain();
	playSound(sound, typedNode(out), 2);
	return { context, out, heard: heardIn(context) };
}

/** The gain that a sound played into `out` goes through first: its level. */
function levelInto(context: FakeAudioContext, out: FakeGain): number | undefined {
	return context.gains.find((gain) => gain.outputs.includes(out))?.gain.value;
}

describe('the sounds of a run', () => {
	it('play the arpeggio of a success: four bell notes that rise, 70 ms apart', () => {
		const notes = played('success').heard.filter((_, index) => index % 2 === 0);
		expect(notes).toEqual([
			{ kind: 'oscillator', freq: 523, at: 2000 },
			{ kind: 'oscillator', freq: 659, at: 2070 },
			{ kind: 'oscillator', freq: 784, at: 2140 },
			{ kind: 'oscillator', freq: 1047, at: 2210 }
		]);
	});

	it('give each bell note a partial an octave above it', () => {
		const partials = played('success').heard.filter((_, index) => index % 2 === 1);
		expect(partials.map(({ freq }) => freq)).toEqual([1047, 1319, 1568, 2093]);
	});

	it('slide the failure down from G4 to D4, once', () => {
		const { context, heard } = played('failure');
		expect(heard).toEqual([{ kind: 'oscillator', freq: 392, at: 2000 }]);
		expect(context.sources[0]?.frequency.events.at(-1)).toEqual({
			kind: 'ramp',
			value: 294,
			time: 2.4
		});
	});

	it('play the spring of a bump, a low tone and its partial, with a click of noise', () => {
		expect(played('bump').heard).toEqual([
			{ kind: 'oscillator', freq: 180, at: 2000 },
			{ kind: 'oscillator', freq: 432, at: 2000 },
			{ kind: 'noise', freq: undefined, at: 2000 }
		]);
	});

	it('play one blip for a move, and two for a turn, G5 then E5', () => {
		expect(played('move').heard).toEqual([{ kind: 'oscillator', freq: 659, at: 2000 }]);
		expect(played('turn').heard).toEqual([
			{ kind: 'oscillator', freq: 784, at: 2000 },
			{ kind: 'oscillator', freq: 659, at: 2060 }
		]);
	});

	it('stop every oscillator they start, once its sound has ended', () => {
		for (const sound of ['success', 'failure', 'bump', 'move', 'turn'] as const) {
			const { context } = played(sound);
			const oscillators = context.sources.filter((source) => source.kind === 'oscillator');
			expect(oscillators.every((source) => (source.stoppedAt ?? 0) > (source.startedAt ?? 0))).toBe(
				true
			);
		}
	});

	it('play the moves 10 dB under the other sounds', () => {
		for (const sound of ['success', 'failure', 'bump'] as const) {
			const { context, out } = played(sound);
			expect(levelInto(context, out)).toBe(1);
		}
		for (const sound of ['move', 'turn'] as const) {
			const { context, out } = played(sound);
			expect(levelInto(context, out)).toBeCloseTo(0.3162, 4);
		}
	});

	it('are played at the volume they were chosen at, 60 out of 100', () => {
		expect(VOLUME).toBeCloseTo((60 / 100) ** 2, 9);
	});
});
