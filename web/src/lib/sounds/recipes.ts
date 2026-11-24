// The sounds of a run (see Sounds in specs.md), synthesized with the Web Audio API, without a
// file: each one a small recipe of oscillators whose pitch and level follow curves, and a burst
// of noise. They are the recipes of the mock-up, `docs/mockups/world-elements/sound.js`, with
// the same numbers, so that they sound as they were chosen there on 2026-11-15 (step 11b).

/** The sounds, by what they say: a success, a failure, a bump, a move, a turn. */
export type Sound = 'success' | 'failure' | 'bump' | 'move' | 'turn';

/**
 * Plays a sound into `out` from `start`, in seconds on the clock of the context of `out`: the
 * nodes it makes stop by themselves once it has ended.
 */
type Recipe = (out: AudioNode, start: number) => void;

/** The frequencies of the notes used, in hertz. */
const HZ = { G4: 392, D4: 294, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 } as const;

/** The level that a ramp of the Web Audio API starts or ends at for silence: it can't reach 0. */
const SILENT = 0.0001;

interface Note {
	/** Seconds after the start of the sound. */
	at?: number;
	type?: OscillatorType;
	freq: number;
	/** The frequency it slides to, over its whole length, if it slides. */
	to?: number;
	/** The seconds its level takes to rise. */
	attack?: number;
	/** The seconds its level takes to die out, once risen. */
	decay?: number;
	level?: number;
}

/**
 * A synthesized note: an oscillator whose level rises in `attack` and dies out in `decay`, from
 * `freq` to `to` if it slides.
 */
function note(
	out: AudioNode,
	start: number,
	{ at = 0, type = 'sine', freq, to, attack = 0.005, decay = 0.3, level = 0.2 }: Note
): void {
	const { context } = out;
	const from = start + at;
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(freq, from);
	if (to !== undefined)
		oscillator.frequency.exponentialRampToValueAtTime(to, from + attack + decay);
	gain.gain.setValueAtTime(SILENT, from);
	gain.gain.exponentialRampToValueAtTime(level, from + attack);
	gain.gain.exponentialRampToValueAtTime(SILENT, from + attack + decay);
	oscillator.connect(gain).connect(out);
	oscillator.start(from);
	oscillator.stop(from + attack + decay + 0.05);
}

/** A burst of noise through a low-pass filter, which dies out in `decay`: a click, a knock. */
function noise(
	out: AudioNode,
	start: number,
	{ cutoff, decay, level }: { cutoff: number; decay: number; level: number }
): void {
	const { context } = out;
	const length = Math.ceil(context.sampleRate * (decay + 0.02));
	const buffer = context.createBuffer(1, length, context.sampleRate);
	const data = buffer.getChannelData(0);
	for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
	const source = context.createBufferSource();
	const filter = context.createBiquadFilter();
	const gain = context.createGain();
	source.buffer = buffer;
	filter.type = 'lowpass';
	filter.frequency.value = cutoff;
	gain.gain.setValueAtTime(level, start);
	gain.gain.exponentialRampToValueAtTime(SILENT, start + decay);
	source.connect(filter).connect(gain).connect(out);
	source.start(start);
}

/** A note of a bell: a sine with a quieter partial above it, which dies out sooner. */
function bell(
	out: AudioNode,
	start: number,
	{ at, freq, decay, partial }: { at: number; freq: number; decay: number; partial: number }
): void {
	const level = 0.16;
	note(out, start, { at, freq, decay, level });
	note(out, start, { at, freq: freq * partial, decay: decay * 0.35, level: level * 0.25 });
}

interface CurveNote {
	at?: number;
	/** Its length, in seconds. */
	length: number;
	/** Its frequency at each second from its start. */
	freq: (time: number) => number;
	curve: number;
	level: number;
}

/**
 * A note whose frequency and level follow curves computed beforehand, one point per
 * millisecond: the port of a recipe of `docs/mockups/world-elements/make-sounds.py`, with the
 * same functions of the time. The level rises in 5 ms, then dies out as exp(-curve·x)·(1 - x).
 */
function curveNote(
	out: AudioNode,
	start: number,
	{ at = 0, length, freq, curve, level }: CurveNote
): void {
	const { context } = out;
	const from = start + at;
	const attack = 0.005;
	const points = Math.max(2, Math.round(length * 1000));
	const rest = Math.max(length - attack, 1e-6);
	const frequencies = new Float32Array(points);
	const levels = new Float32Array(points);
	for (let index = 0; index < points; index += 1) {
		const time = (length * index) / (points - 1);
		const x = Math.min(Math.max((time - attack) / rest, 0), 1);
		frequencies[index] = freq(time);
		levels[index] = level * (time < attack ? time / attack : Math.exp(-curve * x) * (1 - x));
	}
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.frequency.setValueCurveAtTime(frequencies, from, length);
	gain.gain.setValueCurveAtTime(levels, from, length);
	oscillator.connect(gain).connect(out);
	oscillator.start(from);
	oscillator.stop(from + length);
}

/** A tone that wobbles 18 times a second around `base`, by `depth` that dies out by `fade`. */
function wobble(base: number, depth: number, fade: number): (time: number) => number {
	return (time) => base + depth * Math.exp(-fade * time) * Math.sin(2 * Math.PI * 18 * time);
}

/** The tiny blip of a move: one short note that rises a little, `at` seconds in. */
function blip(out: AudioNode, start: number, at: number, freq: number, level: number): void {
	curveNote(out, start, {
		at,
		length: 0.04,
		freq: (time) => freq * (1 + (0.15 * time) / 0.04),
		curve: 4,
		level
	});
}

/** The level of the spring of a bump: the gain make-sounds.py gave its file. */
const SPRING_LEVEL = 0.4177;

/**
 * The recipe of each sound, as chosen on the mock-up and numbered there. Its keys are the
 * sounds: a new one isn't played until it has a recipe.
 */
const RECIPES = {
	/** 41. Arpeggio: four soft bell notes that rise, C5, E5, G5, C6, 70 ms apart. */
	success: (out, start) => {
		[HZ.C5, HZ.E5, HZ.G5, HZ.C6].forEach((freq, index) => {
			bell(out, start, { at: 0.07 * index, freq, decay: index === 3 ? 0.5 : 0.2, partial: 2 });
		});
	},
	/** 48. Soft slide down: one soft note that slides from G4 to D4, never scolding. */
	failure: (out, start) => {
		note(out, start, { freq: HZ.G4, to: HZ.D4, attack: 0.03, decay: 0.37, level: 0.18 });
	},
	/**
	 * 90. Spring (77 ported): a low tone and its partial that wobble 18 times a second and
	 * settle, with a click of noise at the contact.
	 */
	bump: (out, start) => {
		curveNote(out, start, {
			length: 0.45,
			freq: wobble(180, 60, 7),
			curve: 4,
			level: SPRING_LEVEL
		});
		curveNote(out, start, {
			length: 0.25,
			freq: wobble(432, 120, 8),
			curve: 5,
			level: 0.3 * SPRING_LEVEL
		});
		noise(out, start, { cutoff: 20_000, decay: 0.005, level: 0.5 * SPRING_LEVEL });
	},
	/** 91. Tiny blip (88 ported), for `forward()`: E5. */
	move: (out, start) => {
		blip(out, start, 0, HZ.E5, 0.3843);
	},
	/** 91. Tiny blip, for a turn: twice, G5 then E5. */
	turn: (out, start) => {
		blip(out, start, 0, HZ.G5, 0.4383);
		blip(out, start, 0.06, HZ.E5, 0.4383);
	}
} as const satisfies Record<Sound, Recipe>;

/** The sounds of the moves, which come back at each step: 10 dB under the others. */
const QUIETER = 10 ** (-10 / 20);

/** How loud each sound plays, beside the volume of every sound. */
const LEVELS = {
	success: 1,
	failure: 1,
	bump: 1,
	move: QUIETER,
	turn: QUIETER
} as const satisfies Record<Sound, number>;

/**
 * The volume of every sound: the one they were chosen at on the mock-up, 60 out of 100, a gain
 * of 0.36. There is no setting of the volume: the one of the system.
 */
export const VOLUME = 0.36;

/** Plays `sound` into `out` from `start`, in seconds on the clock of its context, at its level. */
export function playSound(sound: Sound, out: AudioNode, start: number): void {
	const level = out.context.createGain();
	level.gain.value = LEVELS[sound];
	level.connect(out);
	RECIPES[sound](level, start);
}
