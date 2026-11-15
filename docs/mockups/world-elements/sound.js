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
// The temperatures, in the order the lists show them; the sounds without one are calm.
const TEMPERATURES = { calm: "Calm", high: "High temperature", explosive: "Explosive temperature" };
// The sounds of the moves play quieter than the others: they come back at each step.
const MOVE_QUIETER = -10;

// The sounds chosen by the owner on 2026-11-15, at the volume 60: the tabs open on them.
const SOUNDS_CHOSEN = { success: "arpeggio", failure: "slide", bump: "made77", move: "made88" };

// The groups of tabs of the sounds, added to those of page.js: one per kind, and the volume of
// every sound, a slider.
const SOUND_VARIANTS = {
  ...Object.fromEntries(Object.entries(SOUNDS).map(([kind, { label, options }]) =>
    // A tab shows the number of its sound alone: the list of the section names them.
    [`${kind}Sound`, { label, options: Object.fromEntries(Object.entries(options).map(([value, { title }]) => [value, title.split(".")[0]])), fallback: SOUNDS_CHOSEN[kind] }])),
  volume: { label: "Volume", range: { min: 0, max: 100, step: 5 }, fallback: "60" },
};

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
    setVolume(chosen.volume);
  }
  if (audio.ctx.state === "suspended") audio.ctx.resume();
  return audio;
}
function setVolume(value) {
  if (audio) audio.volume.gain.value = (Number(value) / 100) ** 2;
}
async function decode(file) {
  if (!decoded.has(file)) {
    decoded.set(file, fetch(`world-elements/sounds/${file}`).then(response => response.arrayBuffer()).then(data => audio.ctx.decodeAudioData(data)));
  }
  return decoded.get(file);
}

// Plays a sound of a kind: the one chosen in the tabs, or `value`; for a move, its `part` ("forward"
// or "turn"), at `rate` times its speed when a step is shorter than at the normal speed.
async function playSound(kind, value = chosen[`${kind}Sound`], { part = "forward", rate = 1 } = {}) {
  const sound = SOUNDS[kind].options[value];
  const { ctx, volume } = audioContext();
  if (sound.play) {
    sound.play(ctx, volume);
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

// A click on the page starts the audio context; a tab of a sound plays the sound chosen; the volume
// applies at once; a button ▶ plays its sound or a scene with its sounds.
document.addEventListener("click", event => {
  const tab = event.target.closest("[data-variant]");
  if (tab?.dataset.variant.endsWith("Sound")) playSound(tab.dataset.variant.slice(0, -"Sound".length), tab.dataset.value);
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
document.addEventListener("input", event => {
  if (event.target.dataset.variant === "volume") setVolume(event.target.value);
});
