import { describe, expect, it, vi } from 'vitest';
import { SoundPlayer } from './sound-player.ts';
import { FakeAudioContext, heardIn } from './test-support.ts';

/** A player, and the contexts it made. */
function playerOf(state: 'suspended' | 'running' = 'running') {
	const made: FakeAudioContext[] = [];
	const player = new SoundPlayer(() => {
		const context = new FakeAudioContext(state);
		made.push(context);
		return context.typed;
	});
	return { player, made };
}

describe('the player of the sounds', () => {
	it('makes no audio context before the first sound', () => {
		const { player, made } = playerOf();
		player.stop();
		expect(made).toEqual([]);
		player.play('move');
		expect(made).toHaveLength(1);
	});

	it('makes one context for every sound', () => {
		const { player, made } = playerOf();
		player.play('move');
		player.play('turn');
		player.wake();
		expect(made).toHaveLength(1);
		expect(made[0]?.sources).toHaveLength(3);
	});

	it('plays a sound at once, or after its delay', () => {
		const { player, made } = playerOf();
		player.play('move');
		const [context] = made;
		if (!context) throw new Error('no context made');
		context.currentTime = 1;
		player.play('bump', 135);
		// One frame later, every sound.
		expect(heardIn(context).map(({ at }) => at)).toEqual([17, 1152, 1152, 1152]);
	});

	it('plays every sound at the volume of every sound, into the speakers', () => {
		const { player, made } = playerOf();
		player.play('failure');
		const [context] = made;
		const volume = context?.gains.find((gain) => gain.outputs.includes(context.destination));
		expect(volume?.gain.value).toBe(0.36);
	});

	it('wakes a context that the browser keeps asleep until a press of the learner', () => {
		const { player, made } = playerOf('suspended');
		player.wake();
		expect(made[0]?.resumed).toBe(1);
		expect(made[0]?.state).toBe('running');
		player.play('move');
		expect(made[0]?.resumed).toBe(1);
	});

	it('wakes a context that Safari interrupted, and leaves a closed one', () => {
		const { player, made } = playerOf();
		player.play('move');
		const [context] = made;
		if (!context) throw new Error('no context made');
		context.state = 'interrupted';
		player.wake();
		expect({ resumed: context.resumed, state: context.state }).toEqual({
			resumed: 1,
			state: 'running'
		});
		context.state = 'closed';
		player.wake();
		expect(context.resumed).toBe(1);
	});

	it('skips a sound that the browser refuses, and says it to the console', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const context = new FakeAudioContext();
		context.createOscillator = () => {
			throw new RangeError('refused');
		};
		const player = new SoundPlayer(() => context.typed);
		expect(() => {
			player.play('move');
		}).not.toThrow();
		expect(warn).toHaveBeenCalledOnce();
	});

	it('fades out what plays at a stop, and plays what comes next anew', () => {
		const { player, made } = playerOf();
		player.play('success');
		const context = made[0];
		if (!context) throw new Error('no context made');
		const [volume, playing] = context.gains;
		player.stop();
		expect(playing?.gain.events).toEqual([{ kind: 'target', value: 0, time: 0 }]);
		player.play('move');
		// A gain of its own, under the same volume, which nothing fades.
		const under = context.gains.filter((gain) => volume && gain.outputs.includes(volume));
		expect(under).toHaveLength(2);
		expect(under[1]?.gain.events).toEqual([]);
	});

	it('plays nothing, and never throws, where the browser makes no context', () => {
		const player = new SoundPlayer(() => undefined);
		expect(() => {
			player.wake();
			player.play('success');
			player.stop();
		}).not.toThrow();
	});
});
