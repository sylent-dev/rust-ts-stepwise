// What plays the sounds in the page (see Sounds in specs.md): one audio context, made at the first
// sound, since a page that never plays one opens no audio of the system, and woken by a press of
// the learner, since a browser plays the sounds of a page only after one.

import { playSound, VOLUME, type Sound } from './recipes.ts';

/** How long a sound stopped takes to fade out, in seconds: cut at once, it would click. */
const FADE = 0.01;

/**
 * How long after it is asked every sound starts, in seconds, the same for all, so that they keep
 * their moments between them: 1/60 s, whatever the screen. It must stay longer than a block of
 * the clock of a context (10.7 ms in Chromium at 48 kHz, measured on 2026-11-24): a sound asked
 * for the present of a clock about to move on would start in its past and lose its attack, the
 * whole rise of a blip of 40 ms. A blip, asked as its move starts, then plays with the first
 * frame where the robot moves; a sound asked later, such as the spring at the contact, plays up
 * to a frame after its moment, too little to hear: a sound late on its picture passes far better
 * than one ahead of it.
 */
const LEAD = 1 / 60;

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
	 * Makes the context, if it isn't made, and wakes it: called at each press of the learner that
	 * moves a program on, such as **Run**, **Resume** or **Step**, so that the sounds that follow
	 * it, at the animation frames, may play. A browser may put a context to sleep meanwhile, a
	 * tab left for another one: Safari has a state of its own for it, `interrupted`, which the
	 * types of a browser don't know, so any context that doesn't run and isn't closed is woken.
	 */
	wake(): void {
		this.#context ??= this.#makeContext();
		const context = this.#context;
		if (!context || context.state === 'running' || context.state === 'closed') return;
		context.resume().catch((error: unknown) => {
			console.warn('sounds: the audio context could not wake', error);
		});
	}

	/**
	 * Plays `sound` in `delay` milliseconds, or at once, `LEAD` later both ways. A sound that the
	 * browser refuses is skipped: a sound is never worth stopping a run, which the page would
	 * take for an error of the application.
	 */
	play(sound: Sound, delay = 0): void {
		this.wake();
		const context = this.#context;
		if (!context) return;
		try {
			const out = this.#out(context);
			playSound(sound, out, context.currentTime + LEAD + Math.max(delay, 0) / 1000);
		} catch (error) {
			console.warn(`sounds: the sound "${sound}" could not play`, error);
		}
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

	/** The gain that the sounds since the last `stop` go through, at the volume of every sound. */
	#out(context: AudioContext): GainNode {
		if (!this.#volume) {
			this.#volume = context.createGain();
			this.#volume.gain.value = VOLUME;
			this.#volume.connect(context.destination);
		}
		if (!this.#playing) {
			this.#playing = context.createGain();
			this.#playing.connect(this.#volume);
		}
		return this.#playing;
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
