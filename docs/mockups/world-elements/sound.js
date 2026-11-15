// The sounds of a run (step 11b): a success, a goal not met, a bump, and a move. Each kind compares
// sounds synthesized with the Web Audio API (no file), CC0 files by Kenney (sounds/, see
// docs/sound-sources.md) and the sounds made by make-sounds.py (sounds-made.js), at a high or an
// explosive temperature: bolder, or wilder. The browser plays a sound only after a click: the audio context starts at
// the first click on the page.

// A synthesized note: an oscillator whose level rises in `attack` seconds and dies out in `decay`,
// from `freq` to `to` (a slide) if given, at `at` seconds from now.
function note(ctx, out, { at = 0, type = "sine", freq, to, attack = 0.005, decay = 0.3, level = 0.2, wobble }) {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + attack + decay);
  // A pitch that wobbles and dies out, as the body of the robot after a bump.
  if (wobble) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = wobble.rate;
    depth.gain.setValueAtTime(wobble.depth, start);
    depth.gain.exponentialRampToValueAtTime(0.01, start + attack + decay);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(start);
    lfo.stop(start + attack + decay + 0.05);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + attack + decay + 0.05);
}

// A burst of noise through a low-pass filter: the knock of a body on a wall.
function noise(ctx, out, { at = 0, cutoff = 900, decay = 0.06, level = 0.3 }) {
  const start = ctx.currentTime + at;
  const length = Math.ceil(ctx.sampleRate * (decay + 0.02));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(level, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
  source.connect(filter).connect(gain).connect(out);
  source.start(start);
}

// A note of a bell or a marimba: a sine with a quieter partial above it, which dies out sooner.
const bell = (ctx, out, { at = 0, freq, decay = 0.5, level = 0.16, partial = 2.76 }) => {
  note(ctx, out, { at, freq, decay, level });
  note(ctx, out, { at, freq: freq * partial, decay: decay * 0.35, level: level * 0.25 });
};

// A note whose frequency and level follow curves computed beforehand, one point per millisecond:
// the port to the Web Audio API of a recipe of make-sounds.py, with the same functions of the time.
// `freq` is a function of the time in seconds; the level rises in `attack`, holds `hold`, then dies
// out as exp(-curve·x)·(1 - x), as `env` of make-sounds.py.
function curveNote(ctx, out, { at = 0, dur, freq, type = "sine", attack = 0.005, curve = 5, hold = 0, level = 1 }) {
  const start = ctx.currentTime + at;
  const points = Math.max(2, Math.round(dur * 1000));
  const rest = Math.max(dur - attack - hold, 1e-6);
  const frequencies = new Float32Array(points);
  const levels = new Float32Array(points);
  for (let i = 0; i < points; i += 1) {
    const t = dur * i / (points - 1);
    frequencies[i] = freq(t);
    const x = Math.min(Math.max((t - attack - hold) / rest, 0), 1);
    levels[i] = level * (t < attack ? t / attack : t < attack + hold ? 1 : Math.exp(-curve * x) * (1 - x));
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueCurveAtTime(frequencies, start, dur);
  gain.gain.setValueCurveAtTime(levels, start, dur);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + dur);
}

// The spring of a bump (77), ported: a low tone and its partial that wobble 18 times a second and
// settle, and a click of noise at the contact; at the gain make-sounds.py gave the file (0.4177), so
// that it plays as loud.
function springBump(ctx, out) {
  const wobble = (base, depth, fade) => t => base + depth * Math.exp(-fade * t) * Math.sin(2 * Math.PI * 18 * t);
  const level = 0.4177;
  curveNote(ctx, out, { dur: 0.45, freq: wobble(180, 60, 7), curve: 4, level });
  curveNote(ctx, out, { dur: 0.25, freq: wobble(432, 120, 8), curve: 5, level: 0.3 * level });
  noise(ctx, out, { cutoff: 20000, decay: 0.005, level: 0.5 * level });
}

// The tiny blip of a move (88), ported: one short note that rises a little for `forward()`, two for
// a turn, at the gains make-sounds.py gave the files.
function tinyBlip(ctx, out, part) {
  const notes = part === "turn" ? [HZ.G5, HZ.E5] : [HZ.E5];
  const level = part === "turn" ? 0.4383 : 0.3843;
  notes.forEach((f, index) => curveNote(ctx, out, { at: 0.06 * index, dur: 0.04, freq: t => f * (1 + 0.15 * t / 0.04), curve: 4, level }));
}

// The frequencies of the notes used, in hertz.
const HZ = { E4: 329.63, F4: 349.23, G4: 392, A4: 440, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5 };

// The candidates of each kind, numbered after the sheet. A synthesized sound has `play`; a file has
// its `file` in sounds/ and its mean level in dB, measured with ffmpeg (volumedetect), so that every
// candidate is played at about the same loudness: the ear prefers the louder of two sounds.
const SOUND_LEVEL = -20;
const SOUNDS = {
  success: {
    label: "Success sound",
    options: {
      rise: { title: "40. Two notes up", source: "synthesized", length: 0.4,
        play: (ctx, out) => { note(ctx, out, { type: "triangle", freq: HZ.C5, decay: 0.18, level: 0.22 }); note(ctx, out, { at: 0.11, type: "triangle", freq: HZ.G5, decay: 0.28, level: 0.22 }); } },
      arpeggio: { title: "41. Arpeggio", source: "synthesized", length: 0.7,
        play: (ctx, out) => [HZ.C5, HZ.E5, HZ.G5, HZ.C6].forEach((freq, index) => bell(ctx, out, { at: 0.07 * index, freq, decay: index === 3 ? 0.5 : 0.2, partial: 2 })) },
      chime: { title: "42. Chime", source: "synthesized", length: 0.9,
        play: (ctx, out) => { bell(ctx, out, { freq: HZ.C6, decay: 0.8, level: 0.13 }); bell(ctx, out, { at: 0.09, freq: HZ.E6, decay: 0.8, level: 0.11 }); } },
      confirmation1: { title: "43. Confirmation 1", source: "Kenney, Interface Sounds", file: "kenney-confirmation-1.ogg", mean: -11.3, length: 0.29 },
      confirmation2: { title: "44. Confirmation 2", source: "Kenney, Interface Sounds", file: "kenney-confirmation-2.ogg", mean: -14.9, length: 0.54 },
      pizzicato: { title: "45. Pizzicato jingle", source: "Kenney, 85 Short Music Jingles", file: "kenney-jingle-pizzicato-2.ogg", mean: -14.8, length: 0.96 },
      steel: { title: "46. Steel drum jingle", source: "Kenney, 85 Short Music Jingles", file: "kenney-jingle-steel-drum-10.ogg", mean: -15.4, length: 0.91 },
    },
  },
  failure: {
    label: "Goal not met sound",
    options: {
      fall: { title: "47. Two notes down", source: "synthesized", length: 0.45,
        play: (ctx, out) => { note(ctx, out, { type: "triangle", freq: HZ.G4, decay: 0.2, level: 0.2 }); note(ctx, out, { at: 0.14, type: "triangle", freq: HZ.E4, decay: 0.3, level: 0.2 }); } },
      slide: { title: "48. Soft slide down", source: "synthesized", length: 0.4,
        play: (ctx, out) => note(ctx, out, { freq: HZ.G4, to: 294, attack: 0.03, decay: 0.37, level: 0.18 }) },
      marimba: { title: "49. Two low marimba notes", source: "synthesized", length: 0.55,
        play: (ctx, out) => { bell(ctx, out, { freq: HZ.A4, decay: 0.25, partial: 3.9 }); bell(ctx, out, { at: 0.15, freq: HZ.F4, decay: 0.4, partial: 3.9 }); } },
      error5: { title: "50. Error 5", source: "Kenney, Interface Sounds", file: "kenney-error-5.ogg", mean: -18.7, length: 0.5 },
      error6: { title: "51. Error 6", source: "Kenney, Interface Sounds", file: "kenney-error-6.ogg", mean: -18, length: 0.5 },
      pizzicato: { title: "52. Pizzicato jingle", source: "Kenney, 85 Short Music Jingles", file: "kenney-jingle-pizzicato-11.ogg", mean: -15.4, length: 0.79 },
      steel: { title: "53. Steel drum jingle", source: "Kenney, 85 Short Music Jingles", file: "kenney-jingle-steel-drum-11.ogg", mean: -14.9, length: 0.83 },
    },
  },
  bump: {
    label: "Bump sound",
    options: {
      thud: { title: "54. Thud", source: "synthesized", length: 0.15,
        play: (ctx, out) => note(ctx, out, { freq: 150, to: 55, decay: 0.14, level: 0.45 }) },
      knock: { title: "55. Knock", source: "synthesized", length: 0.1,
        play: (ctx, out) => { noise(ctx, out, { cutoff: 800, decay: 0.05, level: 0.35 }); note(ctx, out, { type: "triangle", freq: 220, to: 160, decay: 0.08, level: 0.2 }); } },
      boing: { title: "56. Boing", source: "synthesized", length: 0.35,
        play: (ctx, out) => note(ctx, out, { freq: 260, decay: 0.33, level: 0.2, wobble: { rate: 13, depth: 45 } }) },
      bong: { title: "57. Bong", source: "Kenney, Interface Sounds", file: "kenney-bong-1.ogg", mean: -16.2, length: 0.12 },
      drop: { title: "58. Drop 2", source: "Kenney, Interface Sounds", file: "kenney-drop-2.ogg", mean: -19.8, length: 0.19 },
      book: { title: "59. Book set down", source: "Kenney, RPG Sound Pack", file: "kenney-book-place-1.ogg", mean: -18, length: 0.28 },
      leather: { title: "60. Leather dropped", source: "Kenney, RPG Sound Pack", file: "kenney-drop-leather.ogg", mean: -18.7, length: 0.42 },
    },
  },
  // A sound at each move and turn, which specs.md rules out today ("none at each step"): compared
  // on request. A move has a sound for `forward()` and one for a turn (`parts`).
  move: {
    label: "Move sound",
    options: {
      none: { title: "None", source: "specs.md: none at each step", length: 0 },
    },
  },
};
for (const [kind, options] of Object.entries(MADE_SOUNDS)) Object.assign(SOUNDS[kind].options, options);
// Decided on 2026-11-15: the application synthesizes its sounds with the Web Audio API (no file, no
// license, no format a browser may not read). The two sounds chosen among the files, ported, to
// compare with their file by ear.
SOUNDS.bump.options.port77 = { title: "90. Spring, in Web Audio (77)", source: "synthesized, port of 77", temperature: "high", length: 0.41, play: springBump };
SOUNDS.move.options.port88 = { title: "91. Tiny blip, in Web Audio (88)", source: "synthesized, port of 88", temperature: "calm", length: 0.1, play: tinyBlip, parts: { forward: {}, turn: {} } };
// Decided on 2026-11-15: a move or a turn plays its sound up to 2 steps per second, and none
// faster, where it would become a stream that covers the sounds of the end.
const MOVE_SOUND_MAX_RATE = 2;
// The temperatures, in the order the lists show them; the sounds without one are calm.
const TEMPERATURES = { calm: "Calm", high: "High temperature", explosive: "Explosive temperature" };
// The sounds of the moves play quieter than the others: they come back at each step.
const MOVE_QUIETER = -10;

// Decided on 2026-11-15: the sounds chosen by the owner, the spring and the blip as their ports to
// Web Audio, which sound as their files; and the volume they were chosen at, 60 out of 100, a gain of
// 0.36 on every sound (the tabs and the slider that compared them are gone).
const SOUNDS_CHOSEN = { success: "arpeggio", failure: "slide", bump: "port77", move: "port88" };
const VOLUME = 60;

// The audio context, made at the first click (the rule of the browsers), the gain of the volume, and
// the files once decoded.
let audio;
const decoded = new Map();
function audioContext() {
  if (!audio) {
    const ctx = new AudioContext();
    const volume = ctx.createGain();
    volume.connect(ctx.destination);
    audio = { ctx, volume };
    volume.gain.value = (VOLUME / 100) ** 2;
  }
  if (audio.ctx.state === "suspended") audio.ctx.resume();
  return audio;
}
async function decode(file) {
  if (!decoded.has(file)) {
    decoded.set(file, fetch(`world-elements/sounds/${file}`).then(response => response.arrayBuffer()).then(data => audio.ctx.decodeAudioData(data)));
  }
  return decoded.get(file);
}

// Plays a sound of a kind: the one chosen, or `value`; for a move, its `part` ("forward"
// or "turn"), at `rate` times its speed when a step is shorter than at the normal speed.
async function playSound(kind, value = SOUNDS_CHOSEN[kind], { part = "forward", rate = 1 } = {}) {
  const sound = SOUNDS[kind].options[value];
  const { ctx, volume } = audioContext();
  if (sound.play) {
    const level = ctx.createGain();
    level.gain.value = 10 ** ((kind === "move" ? MOVE_QUIETER : 0) / 20);
    level.connect(volume);
    sound.play(ctx, level, part);
    return;
  }
  const { file, mean } = sound.parts?.[part] ?? sound;
  if (!file) return;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = await decode(file);
  source.playbackRate.value = rate;
  gain.gain.value = 10 ** ((SOUND_LEVEL + (kind === "move" ? MOVE_QUIETER : 0) - mean) / 20);
  source.connect(gain).connect(volume);
  source.start();
}

// A click on a button ▶ starts the audio context and plays its sound, or a scene with its sounds.
document.addEventListener("click", event => {
  const button = event.target.closest("[data-play-sound]");
  if (button) {
    const [kind, value, part] = button.dataset.playSound.split(":");
    playSound(kind, value, { part });
  }
  const scene = event.target.closest("[data-play-scene]");
  if (scene) {
    audioContext();
    document.getElementById(scene.dataset.playScene)?.playWithSound?.();
  }
});
