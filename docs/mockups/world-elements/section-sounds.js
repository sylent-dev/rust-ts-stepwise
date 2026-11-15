// Section (step 11b): the sounds of a run, a success, a goal not met and a bump, and a sound at each
// move, decided by ear.

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

// The two sounds chosen among the files, beside their port to the Web Audio API.
const SOUND_PORTS = [
  ["bump:made77", "77. Spring, file"], ["bump:port77", "90. Spring, Web Audio"],
  ["move:made88:forward", "88. Tiny blip, move, file"], ["move:port88:forward", "91. Tiny blip, move, Web Audio"],
  ["move:made88:turn", "88. Tiny blip, turn, file"], ["move:port88:turn", "91. Tiny blip, turn, Web Audio"],
];

SECTIONS.push(["Sounds: success, goal not met, bump, moves", () => `
  <p>Decided, at the volume they were chosen at (60, a gain of 0.36 on every sound): <b>41. Arpeggio</b> for a run where every goal is met, as the robot hops; <b>48. Soft slide down</b> for a goal not met, as it shakes its head; <b>90. Spring</b> for a bump, when its front touches the border of its cell; <b>91. Tiny blip</b>, 10 dB quieter, as a move or a turn starts, up to 2 steps per second only (faster, it would become a stream that covers the sounds of the end). A <code>pick_up()</code> or a <code>drop()</code> that fails plays the spring as the robot shakes, and an error without animation the soft slide, as its line is marked: a run ends with one sound, never two. At <b>Instant</b>, only that sound of the end. Painting, erasing, picking up and dropping make none. Turning the setting <b>Sounds</b> on plays the arpeggio once. <b>Step</b> plays the sound of its action, the blip of a move or a turn included, as at the slowest speeds.</p>
  <p>The application synthesizes every sound with the Web Audio API, without a file (the recipes of <code>sound.js</code>). 90 and 91 are the ports of 77 and 88, made as files by <code>make-sounds.py</code>: the same curves and the same level, heard the same.</p>
  <ul class="sound-pairs">${SOUND_PORTS.map(([sound, title]) =>
    `<li><button type="button" class="sound-play" data-play-sound="${sound}">▶ ${title}</button></li>`).join("")}</ul>
  <p>The button ▶ of a scene plays it once from its start with its sounds (a scene that loops stays silent).</p>
  <div class="page-row">${SOUND_SCENES.map(([name, title]) => soundScene(name, title, { size: 64, sound: `sound-${name}` })).join("")}</div>
  <div class="page-row">${MOVE_SCENES.map(([rate, title]) => soundScene("square", title, { rate, size: 48, sound: `sound-square-${rate}` })).join("")}</div>
  <h3>Compared</h3>
  <p>Fifty sounds were compared on 2026-11-15, one for each end of a run, short and soft, never scolding, at the same loudness: synthesized in the browser (40 to 42, 47 to 49, 54 to 56), files by Kenney under CC0 (43 to 46, 50 to 53, 57 to 60, see <code>docs/sound-sources.md</code>), and bolder then wilder ones made by <code>make-sounds.py</code>, at a high and an explosive temperature (61 to 89, the moves among them). The ones not chosen were removed: the commits of pull request #45 keep them.</p>`]);
