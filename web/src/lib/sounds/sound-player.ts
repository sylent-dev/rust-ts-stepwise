// What plays the sounds in the page (see Sounds in specs.md): one audio context, made at the first
// sound, since a page that never plays one opens no audio of the system, and woken by a press of
// the learner, since a browser plays the sounds of a page only after one.

import { playSound, VOLUME, type Sound } from './recipes.ts';

/** How long a sound stopped takes to fade out, in seconds: cut at once, it would click. */
const FADE = 0.01;

export class SoundPlayer {
	readonly #makeContext: () => AudioContext | undefined;
	#context: AudioContext | undefined;
	/** Every sound at the volume of every sound, into the speakers. */
	#volume: GainNode | undefined;
	/** The sounds since the last `stop`, which a `stop` fades out together. */
	#playing: GainNode | undefined;

	/**
	 * A player that makes its context with `makeContext`, the one of the browser by default;
	 * nothing plays where it makes none.
	 */
	constructor(makeContext: () => AudioContext | undefined = browserContext) {
		this.#makeContext = makeContext;
	}

	/**
	 * Makes the context, if it isn't made, and wakes it: called at a press of the learner, such
	 * as **Run**, so that the sounds that follow it, at the animation frames, may play.
	 */
	wake(): void {
		this.#context ??= this.#makeContext();
		if (this.#context?.state === 'suspended') void this.#context.resume();
	}

	/** Plays `sound` in `delay` milliseconds, or at once. */
	play(sound: Sound, delay = 0): void {
		this.wake();
		const context = this.#context;
		if (!context) return;
		if (!this.#volume) {
			this.#volume = context.createGain();
			this.#volume.gain.value = VOLUME;
			this.#volume.connect(context.destination);
		}
		if (!this.#playing) {
			this.#playing = context.createGain();
			this.#playing.connect(this.#volume);
		}
		playSound(sound, this.#playing, context.currentTime + Math.max(delay, 0) / 1000);
	}

	/**
	 * Stops what plays, and what was to play, in a fade too short to hear: the map that showed it
	 * was put back. What plays next starts anew.
	 */
	stop(): void {
		const playing = this.#playing;
		const context = this.#context;
		if (!playing || !context) return;
		this.#playing = undefined;
		playing.gain.setTargetAtTime(0, context.currentTime, FADE / 3);
	}
}

/**
 * The audio context of the browser; none where the browser has none, or refuses to make one,
 * where the page goes on without sounds.
 */
function browserContext(): AudioContext | undefined {
	// The types of a browser say that `AudioContext` is always there: it isn't in a test, which
	// Node runs.
	if (!('AudioContext' in globalThis)) return undefined;
	try {
		return new AudioContext();
	} catch {
		return undefined;
	}
}
