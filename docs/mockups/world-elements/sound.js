// The sounds of a run (step 11b), decided on 2026-11-15: a success, a goal not met, a bump, and a
// move, synthesized with the Web Audio API, as the application will. The spring and the blip are
// the ports of two sounds made as files by make-sounds.py (sounds-made.js), kept beside them to
// compare by ear. The browser plays a sound only after a click: the audio context starts at the
// first click on a button ▶.

// A synthesized note: an oscillator whose level rises in `attack` seconds and dies out in `decay`,
// from `freq` to `to` (a slide) if given, at `at` seconds from now.
function note(ctx, out, { at = 0, type = "sine", freq, to, attack = 0.005, decay = 0.3, level = 0.2 }) {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + attack + decay);
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
const HZ = { G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 };

// The sounds, by kind, numbered as on the sheet when they were compared. A synthesized sound has
// `play`; a file has its `file` in sounds/ and its mean level in dB, measured with ffmpeg
// (volumedetect), brought to SOUND_LEVEL; a move has a sound for `forward()` and one for a turn
// (`parts`).
const SOUND_LEVEL = -20;
const SOUNDS = {
  success: {
    arpeggio: { title: "41. Arpeggio",
      play: (ctx, out) => [HZ.C5, HZ.E5, HZ.G5, HZ.C6].forEach((freq, index) => bell(ctx, out, { at: 0.07 * index, freq, decay: index === 3 ? 0.5 : 0.2, partial: 2 })) },
  },
  failure: {
    slide: { title: "48. Soft slide down",
      play: (ctx, out) => note(ctx, out, { freq: HZ.G4, to: 294, attack: 0.03, decay: 0.37, level: 0.18 }) },
  },
  bump: {
    port77: { title: "90. Spring, Web Audio", play: springBump },
  },
  move: {
    port88: { title: "91. Tiny blip, Web Audio", play: tinyBlip, parts: { forward: {}, turn: {} } },
  },
};
for (const [kind, sounds] of Object.entries(MADE_SOUNDS)) Object.assign(SOUNDS[kind], sounds);
// Decided on 2026-11-15: a move or a turn plays its sound up to 2 steps per second, and none
// faster, where it would become a stream that covers the sounds of the end.
const MOVE_SOUND_MAX_RATE = 2;
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
  const sound = SOUNDS[kind][value];
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
