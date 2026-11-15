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
    return `<li><span class="sound-buttons">${buttons}</span><span${chosen[`${kind}Sound`] === value ? ' class="is-chosen"' : ""}>${title}</span><small>${source} · ${length.toFixed(2)} s</small></li>`;
  }).join("")}</ul>`;
}).join("");

// The two sounds chosen among the files, beside their port to the Web Audio API.
const SOUND_PORTS = [
  ["bump:made77", "77. Spring, file"], ["bump:port77", "90. Spring, Web Audio"],
  ["move:made88:forward", "88. Tiny blip, move, file"], ["move:port88:forward", "91. Tiny blip, move, Web Audio"],
  ["move:made88:turn", "88. Tiny blip, turn, file"], ["move:port88:turn", "91. Tiny blip, turn, Web Audio"],
];

SECTIONS.push(["Sounds: success, goal not met, bump, moves", () => `
  <p>Chosen on 2026-11-15, at the volume 60: <b>41. Arpeggio</b> for a success, <b>48. Soft slide down</b> for a goal not met, <b>77. Spring</b> for a bump, <b>88. Tiny blip</b> for a move or a turn, up to 2 steps per second. A <code>pick_up()</code> or a <code>drop()</code> that fails plays the spring as it shakes, and an error without animation the soft slide, as its line is marked: a run ends with one sound, never two. At the speed <b>Instant</b>, which draws no animation, only that sound of the end plays. Decided: the application synthesizes every sound with the Web Audio API, without a file. 77 and 88 were made as files by <code>make-sounds.py</code>: their ports, 90 and 91, have the same curves and the same level, and sound the same (heard on 2026-11-15): 90 and 91 are the ones kept.</p>
  <ul class="sound-pairs">${SOUND_PORTS.map(([sound, title]) =>
    `<li><button type="button" class="sound-play" data-play-sound="${sound}">▶ ${title}</button></li>`).join("")}</ul>
  <p>How to compare: one sound for each end of a run, short and soft, never scolding. Each tab of <b>Success sound</b>, <b>Goal not met sound</b>, <b>Bump sound</b> and <b>Move sound</b> plays its sound when it is chosen (the numbers are named in the lists below); the button ▶ of a scene plays it once from its start with the sounds chosen (a scene that loops stays silent). The <b>Volume</b> slider sets the level of every sound. Calm: 40 to 42, 47 to 49 and 54 to 56 are synthesized in the browser (no file), the others are files by Kenney under CC0. High and explosive temperatures: bolder, then wilder, made by <code>make-sounds.py</code> (Python, standard library, a recipe per sound). Their levels are matched, so that a louder sound doesn't win by its loudness alone.</p>
  <div class="page-row">${SOUND_SCENES.map(([name, title]) => soundScene(name, title, { size: 64, sound: `sound-${name}` })).join("")}</div>
  ${["success", "failure", "bump"].map(kind => `<h3>${SOUNDS[kind].label}</h3>${soundList(kind)}`).join("")}
  <h3>Move sound</h3>
  <p>Decided: a move or a turn plays its sound up to 2 steps per second, quieter than the other sounds; faster, none, where it would become a stream that covers the sounds of the end. The square at 5 steps per second plays the end alone.</p>
  <div class="page-row">${MOVE_SCENES.map(([rate, title]) => soundScene("square", title, { rate, size: 48, sound: `sound-square-${rate}` })).join("")}</div>
  ${soundList("move")}`]);
