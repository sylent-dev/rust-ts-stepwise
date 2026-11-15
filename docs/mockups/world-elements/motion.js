// The animations of the robot (step 11a). A scene is a small map, a program and the trace of its
// steps, played in a loop at a speed. The robot, the items and the paint are drawn over the map, so
// that they move; the map underneath (map.js) draws the ground and the goal marks.

// The animated speeds of the status bar, in steps per second (web/src/lib/pace.ts); Instant draws
// no animation.
const SPEEDS_ANIMATED = [1, 2, 5, 20];

const ANGLES ={ north: 0, east: 90, south: 180, west: 270 };
const AHEAD = { 0: [0, -1], 90: [1, 0], 180: [0, 1], 270: [-1, 0] };
const easeInOut = t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
const lerp = (from, to, t) => from + (to - from) * t;
const clamp01 = t => Math.min(Math.max(t, 0), 1);

// The wait before the first step, and after the last one before the scene starts again.
const LEAD = 800;
const END_HOLD = 2200;

// The scenes of the page, by name, registered by the sections.
const SCENES = {};

// A scene in the page: the map with its layer of moving things, the program beside it. Its player
// starts once the sheet is drawn (startScenes).
function motionScene(name, { rate, size = 48, code = true } = {}) {
  const scene = SCENES[name];
  const layer = `<div class="motion-layer" style="--cell:${size}px"><svg viewBox="0 0 ${scene.rows[0].length * 64} ${scene.rows.length * 64}" aria-hidden="true"></svg><div class="motion-items"></div><div class="motion-robot"></div></div>`;
  const program = code ? `<div class="motion-panel"><ol class="motion-code">${scene.program.map(line => `<li>${line}</li>`).join("")}</ol><div class="motion-status"></div></div>` : "";
  return `<div class="motion-scene" data-scene="${name}" data-rate="${rate}" data-size="${size}"><div class="motion-stage">${appMap(scene.rows, scene.marks, size)}${layer}</div>${program}</div>`;
}

// The duration of an action at a speed: the one chosen for the normal speed, shortened when a step
// is shorter, so that the robot still rests a moment between two steps. Tuned at every speed in
// step 14.
const actionTime = (normal, rate) => Math.min(normal, 0.8 * 1000 / rate);

// What each action does to the world once it has run, and how it draws while it runs (`p` from 0
// to 1, eased by the caller). An action missing here changes nothing (a line of computation).
const key = (x, y) => `${x},${y}`;
const passageKey = (a, b) => [a, b].sort().join(" ");
const ACTIONS = {
  forward: {
    commit(world) {
      const [dx, dy] = AHEAD[world.angle];
      const from = key(world.x, world.y);
      world.x += dx;
      world.y += dy;
      const to = key(world.x, world.y);
      if (world.brush) {
        world.paint.set(to, world.brush);
        world.passages.add(passageKey(from, to));
      }
      if (world.eraser) eraseCell(world, to);
    },
    pose(world, p) {
      const [dx, dy] = AHEAD[world.angle];
      return { x: world.x + dx * p, y: world.y + dy * p };
    },
  },
  left: { commit: world => { world.angle = (world.angle + 270) % 360; }, pose: (world, p) => ({ angle: world.angle - 90 * p }) },
  right: { commit: world => { world.angle = (world.angle + 90) % 360; }, pose: (world, p) => ({ angle: world.angle + 90 * p }) },
  stop: { commit: world => { world.brush = null; } },
  erase: { commit: world => { world.brush = null; world.eraser = true; eraseCell(world, key(world.x, world.y)); } },
  "stop-erasing": { commit: world => { world.eraser = false; } },
};
for (const color of Object.keys(PAINT_SHADES)) {
  ACTIONS[`paint:${color}`] = { commit: world => { world.eraser = false; world.brush = color; world.paint.set(key(world.x, world.y), color); } };
}

function eraseCell(world, cell) {
  world.paint.delete(cell);
  for (const passage of world.passages) if (passage.split(" ").includes(cell)) world.passages.delete(passage);
}

const startWorld = scene => ({
  x: scene.robot.x, y: scene.robot.y, angle: ANGLES[scene.robot.dir],
  brush: null, eraser: false, carrying: false, lit: null,
  paint: new Map(Object.entries(scene.paint ?? {})), passages: new Set(scene.passages ?? []),
  items: new Set(scene.items ?? []),
});

// The paint of the world, each cell drawing its half of a passage in its own color (see map.js),
// and the stroke being laid behind the robot while it moves with its brush down.
function drawPaint(world, active) {
  const center = cell => cell.split(",").map(value => Number(value) * 64 + 32);
  const shapes = [];
  for (const passage of world.passages) {
    const [a, b] = passage.split(" ");
    const [ax, ay] = center(a);
    const [bx, by] = center(b);
    for (const [cell, x, y] of [[a, ax, ay], [b, bx, by]]) {
      const color = world.paint.get(cell);
      if (color) shapes.push(`<path d="M${x} ${y} L${(ax + bx) / 2} ${(ay + by) / 2}" stroke="${paintShade(color)}" stroke-width="${STROKE}"/>`);
    }
  }
  for (const [cell, color] of world.paint) {
    const [x, y] = center(cell);
    shapes.push(`<circle cx="${x}" cy="${y}" r="${STROKE / 2}" fill="${paintShade(color)}"/>`);
  }
  if (active) shapes.push(active);
  return shapes.join("");
}

let motionGeneration = 0;

function playScene(root) {
  const generation = motionGeneration;
  const scene = SCENES[root.dataset.scene];
  const rate = Number(root.dataset.rate);
  const size = Number(root.dataset.size);
  const paintLayer = root.querySelector(".motion-layer svg");
  const itemsLayer = root.querySelector(".motion-items");
  const robot = root.querySelector(".motion-robot");
  const lines = root.querySelectorAll(".motion-code li");
  const status = root.querySelector(".motion-status");
  const period = 1000 / rate;
  const duration = actionTime(Number(chosen.moveTime), rate);
  const steps = scene.trace.length;
  let world;
  let applied;
  let start;
  const reset = now => { world = startWorld(scene); applied = 0; start = now; };

  const frame = now => {
    if (generation !== motionGeneration || !root.isConnected) return;
    if (start === undefined) reset(now);
    const elapsed = now - start - LEAD;
    // The step under way, started at its own time, and how far its action has gone.
    const current = elapsed < 0 ? -1 : Math.min(Math.floor(elapsed / period), steps);
    if (elapsed > steps * period + END_HOLD) { reset(now); requestAnimationFrame(frame); return; }
    while (applied < Math.min(current, steps)) {
      ACTIONS[scene.trace[applied][1]]?.commit(world);
      applied += 1;
    }
    const action = current >= 0 && current < steps ? ACTIONS[scene.trace[current][1]] : undefined;
    const progress = action?.pose ? clamp01((elapsed - current * period) / duration) : 1;
    const pose = { x: world.x, y: world.y, angle: world.angle, ...action?.pose?.(world, easeInOut(progress)) };
    const ended = current >= steps;
    if (ended) world.lit = scene.end ?? null;

    // The stroke laid behind the robot, from the center of the cell it leaves to its own center.
    let stroke = "";
    if (action === ACTIONS.forward && world.brush && current >= 0) {
      stroke = `<path d="M${world.x * 64 + 32} ${world.y * 64 + 32} L${pose.x * 64 + 32} ${pose.y * 64 + 32}" stroke="${paintShade(world.brush)}" stroke-width="${STROKE}" stroke-linecap="round"/>`;
    }
    paintLayer.innerHTML = drawPaint(world, stroke);
    itemsLayer.innerHTML = [...world.items].map(cell => {
      const [x, y] = cell.split(",").map(Number);
      return `<img src="${element("item")}" alt="" style="transform:translate(${x * size}px,${y * size}px)">`;
    }).join("");
    robot.style.transform = `translate(${pose.x * size}px, ${pose.y * size}px) rotate(${pose.angle}deg)`;
    robot.innerHTML = `<img src="${element("robot")}" alt="">${world.carrying ? `<img class="is-carried" src="${element("item")}" alt="">` : ""}${world.lit ? `<img src="${element(world.lit === "success" ? "eyes-lit" : "eyes-dim")}" alt="">` : ""}`;

    // The highlighted line is the one of the next step: it moves on when the action of the step
    // ends, or as soon as the step starts (the tab Highlight).
    const moved = current >= 0 && (chosen.highlight === "start" || progress >= 1);
    const next = moved ? current + 1 : Math.max(current, 0);
    lines.forEach((line, index) => line.classList.toggle("is-next", next < steps && scene.trace[next][0] === index));
    if (status) status.textContent = ended ? `Ended · ${scene.end === "success" ? "map passed" : "goal not met"} · ${steps} steps` : `Running · ${next} steps`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function startScenes() {
  motionGeneration += 1;
  document.querySelectorAll(".motion-scene").forEach(playScene);
}
AFTER_RENDER.push(startScenes);
