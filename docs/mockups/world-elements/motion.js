// The animations of the robot (step 11a). A scene is a small map, a program and the trace of its
// steps, played in a loop at a speed. The robot, the items and the paint are drawn over the map, so
// that they move; the map underneath (map.js) draws the ground and the goal marks.

// The animated speeds of the status bar, in steps per second (web/src/lib/pace.ts); Instant draws
// no animation.
const SPEEDS_ANIMATED = [1, 2, 5, 20];

const ANGLES ={ north: 0, east: 90, south: 180, west: 270 };
const AHEAD = { 0: [0, -1], 90: [1, 0], 180: [0, 1], 270: [-1, 0] };
// The normal speed, the one of a first visit, and the time a move or a turn takes at that speed
// (decided at step 11a).
const NORMAL_SPEED = 2;
const MOVE_TIME = 300;

// How far an overshoot goes past its end, as a share of a cell or of a quarter turn.
const OVERSHOOT = 0.05;

// The curve 1 + (c + 1)(t - 1)³ + c(t - 1)², which leaves at once and goes past its end by
// 4c³ / 27(c + 1)² before it settles back: `c` found by bisection for the share asked, once.
const backCurves = new Map();
function backCurve(share) {
  if (!backCurves.has(share)) {
    let [low, high] = [0, 10];
    for (let round = 0; round < 40; round += 1) {
      const c = (low + high) / 2;
      if (4 * c ** 3 / (27 * (c + 1) ** 2) < share) low = c; else high = c;
    }
    backCurves.set(share, low);
  }
  return backCurves.get(share);
}

const smooth = t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
// The share of the time a smooth overshoot spends going past its end, the rest settling back.
const SMOOTH_REACH = 0.65;

// The easings compared for a move and a turn: `t` from 0 to 1, the share of the way done. Decided
// at step 11a: a move is smooth, so that the robot stops clearly on its cell, and a turn overshoots,
// for a livelier pivot.
const EASINGS = {
  "in-out": smooth,
  linear: t => t,
  out: t => 1 - (1 - t) ** 3,
  // Leaves at once, goes a little past its end, then settles back.
  overshoot: t => {
    const c = backCurve(OVERSHOOT);
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
  },
  // Leaves gently as Smooth, goes a little past its end, then settles back as gently.
  "smooth-overshoot": t => {
    const share = OVERSHOOT;
    return t < SMOOTH_REACH
      ? (1 + share) * smooth(t / SMOOTH_REACH)
      : 1 + share - share * smooth((t - SMOOTH_REACH) / (1 - SMOOTH_REACH));
  },
};
const lerp = (from, to, t) => from + (to - from) * t;
const clamp01 = t => Math.min(Math.max(t, 0), 1);

// The wait before the first step, and after the last one before the scene starts again.
const LEAD = 800;
const END_HOLD = 2200;

const MOVE_EASE = "in-out";
const TURN_EASE = "overshoot";

// The scenes of the page, by name, registered by the sections.
const SCENES = {};

// A scene in the page: the map with its layer of moving things, the program beside it. Its player
// starts once the sheet is drawn (startScenes).
// `move` and `turn` choose an easing of EASINGS for this scene alone, instead of the decided ones;
// `down`, `up` and `erase` a variant of the tabs of the paint, instead of the tabs.
function motionScene(name, { rate = NORMAL_SPEED, size = 48, code = true, move = "", turn = "", down = "", up = "", erase = "" } = {}) {
  const scene = SCENES[name];
  const layer = `<div class="motion-layer" style="--cell:${size}px"><svg viewBox="0 0 ${scene.rows[0].length * 64} ${scene.rows.length * 64}" aria-hidden="true"></svg><div class="motion-items"></div><div class="motion-robot"></div></div>`;
  const program = code ? `<div class="motion-panel"><ol class="motion-code">${scene.program.map(line => `<li>${line}</li>`).join("")}</ol><div class="motion-status"></div></div>` : "";
  return `<div class="motion-scene" data-scene="${name}" data-rate="${rate}" data-size="${size}" data-move="${move}" data-turn="${turn}" data-down="${down}" data-up="${up}" data-erase="${erase}"><div class="motion-stage">${appMap(scene.rows, scene.marks, size)}${layer}</div>${program}</div>`;
}

// The duration of an action at a speed: the one chosen for the normal speed, shortened when a step
// is shorter, so that the robot still rests a moment between two steps. Tuned at every speed in
// step 14.
const actionTime = (normal, rate) => Math.min(normal, 0.8 * 1000 / rate);

// Half the length of the robot, out of 64 for a cell: its front and its back, from its center.
const ROBOT_HALF = 21;
// The shade of the ring of the eraser put down, the one of the dimmed eyes.
const ERASER_SHADE = "#7d8798";

// What each action does to the world once it has run (`commit`), and how it draws while it runs:
// `pose` moves, turns or scales the robot (`p` from 0 to 1, eased by the caller with `ease`),
// `removes` lists the paint that the action takes away, drawn as the tab Erasing says, and `ring`
// the color of a ring around the robot when a tool goes down. `timed` says whether the action
// takes time under the variants of the scene; an action missing here changes nothing (a line of
// computation) and takes none.
const key = (x, y) => `${x},${y}`;
const passageKey = (a, b) => [a, b].sort().join(" ");
const passagesOf = (world, cell) => [...world.passages].filter(passage => passage.split(" ").includes(cell));
const pressed = p => ({ scale: 1 - 0.1 * Math.sin(Math.PI * p) });
const lifted = p => ({ scale: 1 + 0.06 * Math.sin(Math.PI * p) });
// A tool put down. The eraser always takes time: it takes away the paint around its cell.
const toolDown = (commit, ring, removes) => ({
  ease: "cue",
  timed: variants => variants.down !== "none" || removes !== undefined,
  removes,
  pose: (world, p, variants) => ["press", "both"].includes(variants.down) ? pressed(p) : {},
  ring: (world, variants) => ["ripple", "both"].includes(variants.down) ? ring(world) : null,
  commit,
});
const toolUp = commit => ({
  ease: "cue",
  timed: variants => variants.up === "lift",
  pose: (world, p, variants) => variants.up === "lift" ? lifted(p) : {},
  commit,
});
const ACTIONS = {
  forward: {
    ease: "move",
    timed: () => true,
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
    removes(world) {
      if (!world.eraser) return null;
      const [dx, dy] = AHEAD[world.angle];
      const to = key(world.x + dx, world.y + dy);
      return { cell: to, passages: passagesOf(world, to) };
    },
  },
  left: { ease: "turn", timed: () => true, commit: world => { world.angle = (world.angle + 270) % 360; }, pose: (world, p) => ({ angle: world.angle - 90 * p }) },
  right: { ease: "turn", timed: () => true, commit: world => { world.angle = (world.angle + 90) % 360; }, pose: (world, p) => ({ angle: world.angle + 90 * p }) },
  stop: toolUp(world => { world.brush = null; }),
  erase: toolDown(
    world => { world.brush = null; world.eraser = true; eraseCell(world, key(world.x, world.y)); },
    () => ERASER_SHADE,
    world => ({ cell: key(world.x, world.y), passages: passagesOf(world, key(world.x, world.y)) }),
  ),
  "stop-erasing": toolUp(world => { world.eraser = false; }),
};
for (const color of Object.keys(PAINT_SHADES)) {
  ACTIONS[`paint:${color}`] = toolDown(world => { world.eraser = false; world.brush = color; world.paint.set(key(world.x, world.y), color); }, () => paintShade(color));
}

function eraseCell(world, cell) {
  world.paint.delete(cell);
  for (const passage of passagesOf(world, cell)) world.passages.delete(passage);
}

const startWorld = scene => ({
  x: scene.robot.x, y: scene.robot.y, angle: ANGLES[scene.robot.dir],
  brush: null, eraser: false, carrying: false, lit: null,
  paint: new Map(Object.entries(scene.paint ?? {})), passages: new Set((scene.passages ?? []).map(passage => passageKey(...passage.split(" ")))),
  items: new Set(scene.items ?? []),
});

const center = cell => cell.split(",").map(value => Number(value) * 64 + 32);
const segment = ([x1, y1], [x2, y2], color, cap = "butt", opacity = 1) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${paintShade(color)}" stroke-width="${STROKE}" stroke-linecap="${cap}" opacity="${opacity}"/>`;
const dot = ([x, y], color, opacity = 1) => `<circle cx="${x}" cy="${y}" r="${STROKE / 2}" fill="${paintShade(color)}" opacity="${opacity}"/>`;
const between = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// The paint of the world, each cell drawing its half of a passage in its own color (see map.js).
// `removing` is the paint an action takes away while it runs, at `p`: with "fade" it fades; with
// "pull" the robot rolls over the paint of its cell, and each passage pulls back toward the cell
// at its other end, as if the stroke were drawn back in.
function drawPaint(world, removing, p, style) {
  const shapes = [];
  for (const passage of world.passages) {
    const [a, b] = passage.split(" ");
    const going = removing?.passages.includes(passage);
    if (going && style === "pull") {
      // From the cell that loses its paint toward the other one, which keeps its round end.
      const [lost, kept] = a === removing.cell ? [a, b] : [b, a];
      const [from, to, middle] = [center(lost), center(kept), between(center(lost), center(kept), 0.5)];
      const tip = between(from, to, p);
      if (p < 0.5 && world.paint.get(lost)) shapes.push(segment(tip, middle, world.paint.get(lost), "round"));
      if (world.paint.get(kept)) shapes.push(segment(p < 0.5 ? middle : tip, to, world.paint.get(kept), "round"));
      continue;
    }
    for (const cell of [a, b]) {
      const color = world.paint.get(cell);
      if (color) shapes.push(segment(center(cell), between(center(a), center(b), 0.5), color, "butt", going ? 1 - p : 1));
    }
  }
  for (const [cell, color] of world.paint) {
    const going = removing?.cell === cell;
    shapes.push(dot(center(cell), color, going && style === "fade" ? 1 - p : 1));
  }
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
  const duration = actionTime(MOVE_TIME, rate);
  const easings = {
    move: EASINGS[root.dataset.move || MOVE_EASE],
    turn: EASINGS[root.dataset.turn || TURN_EASE],
    cue: EASINGS["in-out"],
  };
  const variants = {
    down: root.dataset.down || chosen.brushDown,
    up: root.dataset.up || chosen.brushUp,
    erase: root.dataset.erase || chosen.eraseMove,
  };
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
    const progress = action?.timed(variants) ? clamp01((elapsed - current * period) / duration) : 1;
    const eased = action ? easings[action.ease](progress) : 1;
    const pose = { x: world.x, y: world.y, angle: world.angle, scale: 1, ...action?.pose(world, eased, variants) };
    const ended = current >= steps;
    if (ended) world.lit = scene.end ?? null;

    let paint = drawPaint(world, action?.removes?.(world), progress, variants.erase);
    // The stroke laid behind the robot, from the center of the cell it leaves to its own center.
    if (action === ACTIONS.forward && world.brush) {
      paint += segment(center(key(world.x, world.y)), center(key(pose.x, pose.y)), world.brush, "round");
    }
    // The ring of a tool put down, growing from under the robot as it fades.
    const ring = action?.ring?.(world, variants);
    if (ring && progress < 1) {
      const [x, y] = center(key(world.x, world.y));
      paint += `<circle cx="${x}" cy="${y}" r="${ROBOT_HALF + 16 * progress}" fill="none" stroke="${ring}" stroke-width="${5 * (1 - progress) + 1}" opacity="${1 - progress}"/>`;
    }
    paintLayer.innerHTML = paint;
    itemsLayer.innerHTML = [...world.items].map(cell => {
      const [x, y] = cell.split(",").map(Number);
      return `<img src="${element("item")}" alt="" style="transform:translate(${x * size}px,${y * size}px)">`;
    }).join("");
    robot.style.transform = `translate(${pose.x * size}px, ${pose.y * size}px) rotate(${pose.angle}deg) scale(${pose.scale})`;
    robot.innerHTML = `<img src="${element("robot")}" alt="">${world.carrying ? `<img class="is-carried" src="${element("item")}" alt="">` : ""}${world.lit ? `<img src="${element(world.lit === "success" ? "eyes-lit" : "eyes-dim")}" alt="">` : ""}`;

    // The highlighted line is the one of the next step: it moves on once the action of the step
    // has ended, so that a line stays lit while the robot does what it says (decided at step 11a).
    const moved = current >= 0 && progress >= 1;
    const next = moved ? current + 1 : Math.max(current, 0);
    lines.forEach((line, index) => line.classList.toggle("is-next", next < steps && scene.trace[next][0] === index));
    const result = { success: " · map passed", failure: " · goal not met" }[scene.end] ?? "";
    if (status) status.textContent = ended ? `Ended${result} · ${steps} steps` : `Running · ${next} steps`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function startScenes() {
  motionGeneration += 1;
  document.querySelectorAll(".motion-scene").forEach(playScene);
}
AFTER_RENDER.push(startScenes);
