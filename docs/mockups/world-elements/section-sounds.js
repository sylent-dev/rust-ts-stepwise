// Section (step 11b): the sounds of a run, a success, a goal not met and a bump, and a sound at each
// move, compared by ear.

// An error that the robot doesn't show: a division by zero.
SCENES.dividing = {
  rows: ["#####", "#...#", "#####"],
  robot: { x: 1, y: 1, dir: "east" },
  program: ["forward()", "let side = 4 / 0", "forward()"],
  trace: [[0, "forward"], [1]],
  end: "error",
};

const SOUND_SCENES = [["success", "Every goal met"], ["failure", "A goal not met"], ["bumping", "A bump"], ["pickEmpty", "No item to pick up"], ["dividing", "Another error"]];
const MOVE_SCENES = [[2, "The square, 2 steps per second"], [5, "The square, 5 steps per second"]];

// A button ▶ over a scene, which plays it once from its start with the sounds chosen.
const soundScene = (name, title, options) => `<div class="page-slot"><span>${title} <button type="button" class="sound-play" data-play-scene="${options.sound}">▶ Play with sound</button></span>${motionScene(name, options)}</div>`;

// The list of the sounds of a kind, grouped by temperature, each with its button ▶ (two for a move).
const soundList = kind => Object.entries(TEMPERATURES).map(([temperature, label]) => {
  const options = Object.entries(SOUNDS[kind].options).filter(([value, sound]) => value !== "none" && (sound.temperature ?? "calm") === temperature);
  if (options.length === 0) return "";
  return `<p class="sound-temperature">${label}</p><ul class="sound-list">${options.map(([value, { title, source, length, parts }]) => {
    const buttons = parts
      ? ["forward", "turn"].map(part => `<button type="button" class="sound-play" data-play-sound="${kind}:${value}:${part}" aria-label="Play ${title}, ${part}">▶ ${part === "forward" ? "move" : "turn"}</button>`).join("")
      : `<button type="button" class="sound-play" data-play-sound="${kind}:${value}" aria-label="Play ${title}">▶</button>`;
    return `<li><span class="sound-buttons">${buttons}</span><span${SOUNDS_CHOSEN[kind] === value ? ' class="is-chosen"' : ""}>${title}</span><small>${source} · ${length.toFixed(2)} s</small></li>`;
  }).join("")}</ul>`;
}).join("");

// The two sounds chosen among the files, beside their port to the Web Audio API.
const SOUND_PORTS = [
  ["bump:made77", "77. Spring, file"], ["bump:port77", "90. Spring, Web Audio"],
  ["move:made88:forward", "88. Tiny blip, move, file"], ["move:port88:forward", "91. Tiny blip, move, Web Audio"],
  ["move:made88:turn", "88. Tiny blip, turn, file"], ["move:port88:turn", "91. Tiny blip, turn, Web Audio"],
];

SECTIONS.push(["Sounds: success, goal not met, bump, moves", () => `
  <p>Decided, at the volume they were chosen at (60, a gain of 0.36 on every sound): <b>41. Arpeggio</b> for a run where every goal is met, as the robot hops; <b>48. Soft slide down</b> for a goal not met, as it shakes its head; <b>90. Spring</b> for a bump, when its front touches the border of its cell; <b>91. Tiny blip</b>, 10 dB quieter, as a move or a turn starts, up to 2 steps per second only (faster, it would become a stream that covers the sounds of the end). A <code>pick_up()</code> or a <code>drop()</code> that fails plays the spring as the robot shakes, and an error without animation the soft slide, as its line is marked: a run ends with one sound, never two. At <b>Instant</b>, only that sound of the end. Painting, erasing, picking up and dropping make none. Turning the setting <b>Sounds</b> on plays the arpeggio once.</p>
  <p>The application synthesizes every sound with the Web Audio API, without a file (the recipes of <code>sound.js</code>). 90 and 91 are the ports of 77 and 88, made as files by <code>make-sounds.py</code>: the same curves and the same level, heard the same.</p>
  <ul class="sound-pairs">${SOUND_PORTS.map(([sound, title]) =>
    `<li><button type="button" class="sound-play" data-play-sound="${sound}">▶ ${title}</button></li>`).join("")}</ul>
  <p>The button ▶ of a scene plays it once from its start with its sounds (a scene that loops stays silent).</p>
  <div class="page-row">${SOUND_SCENES.map(([name, title]) => soundScene(name, title, { size: 64, sound: `sound-${name}` })).join("")}</div>
  <div class="page-row">${MOVE_SCENES.map(([rate, title]) => soundScene("square", title, { rate, size: 48, sound: `sound-square-${rate}` })).join("")}</div>
  <h3>Compared, the chosen ones in bold</h3>
  <p>One sound for each end of a run, short and soft, never scolding, at the same loudness. Calm: 40 to 42, 47 to 49 and 54 to 56 synthesized in the browser, the others files by Kenney under CC0 (see <code>docs/sound-sources.md</code>). High and explosive temperatures, bolder then wilder: made by <code>make-sounds.py</code> (Python, standard library, a recipe per sound). The moves were compared on request, <code>specs.md</code> having none at each step until then.</p>
  ${["success", "failure", "bump", "move"].map(kind => `<h3>${SOUNDS[kind].label}</h3>${soundList(kind)}`).join("")}`]);
