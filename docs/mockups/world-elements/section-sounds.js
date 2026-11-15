// Section (step 11b): the sounds of a run, a success, a goal not met and a bump, and a sound at each
// move, compared by ear.

const SOUND_SCENES = [["success", "Every goal met"], ["failure", "A goal not met"], ["bumping", "A bump"]];
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

SECTIONS.push(["Sounds: success, goal not met, bump, moves", () => `
  <p>Open: one sound for each end of a run, short and soft, never scolding. Each tab of <b>Success sound</b>, <b>Goal not met sound</b>, <b>Bump sound</b> and <b>Move sound</b> plays its sound when it is chosen (the numbers are named in the lists below); the button ▶ of a scene plays it once from its start with the sounds chosen (a scene that loops stays silent). The <b>Volume</b> slider sets the level of every sound. Calm: 40 to 42, 47 to 49 and 54 to 56 are synthesized in the browser (no file), the others are files by Kenney under CC0. High and explosive temperatures: bolder, then wilder, made by <code>make-sounds.py</code> (Python, standard library, a recipe per sound). Their levels are matched, so that a louder sound doesn't win by its loudness alone.</p>
  <div class="page-row">${SOUND_SCENES.map(([name, title]) => soundScene(name, title, { size: 64, sound: `sound-${name}` })).join("")}</div>
  ${["success", "failure", "bump"].map(kind => `<h3>${SOUNDS[kind].label}</h3>${soundList(kind)}`).join("")}
  <h3>Move sound</h3>
  <p>Compared on request: <code>specs.md</code> says today <i>"none at each step"</i>. A move plays quieter than the other sounds, and faster when a step is shorter: listen to the square at 5 steps per second, and think of a loop of 200 steps.</p>
  <div class="page-row">${MOVE_SCENES.map(([rate, title]) => soundScene("square", title, { rate, size: 48, sound: `sound-square-${rate}` })).join("")}</div>
  ${soundList("move")}`]);
