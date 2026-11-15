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
// `erase` a look of the eraser compared, instead of the decided one, and `carry` a look of picking up
// and dropping, `bump` a look of the bump and `fail` a look of a pick up or a drop that fails
// and `success` and `failure` a look of the end of a run compared; `motion` is "full", or a level of
// less motion of LESS_MOTION; `sound`, an id that a button ▶ names (`data-play-scene`) to play the
// scene once from its start with its sounds (sound.js), the scene being silent otherwise.
function motionScene(name, { rate = NORMAL_SPEED, size = 48, code = true, move = "", turn = "", erase = "", carry = "", bump = "", fail = "", success = "", failure = "", motion = "full", sound = "" } = {}) {
  const scene = SCENES[name];
  const layer = `<div class="motion-layer" style="--cell:${size}px"><svg viewBox="0 0 ${scene.rows[0].length * 64} ${scene.rows.length * 64}" aria-hidden="true"></svg><div class="motion-items"></div><div class="motion-robot"></div><svg class="motion-over" viewBox="0 0 ${scene.rows[0].length * 64} ${scene.rows.length * 64}" aria-hidden="true"></svg><div class="motion-flags"></div></div>`;
  const program = code ? `<div class="motion-panel"><ol class="motion-code">${scene.program.map(line => `<li>${line}</li>`).join("")}</ol><div class="motion-status"></div></div>` : "";
  return `<div class="motion-scene"${sound ? ` id="${sound}"` : ""} data-scene="${name}" data-rate="${rate}" data-size="${size}" data-move="${move}" data-turn="${turn}" data-erase="${erase}" data-carry="${carry}" data-bump="${bump}" data-fail="${fail}" data-success="${success}" data-failure="${failure}" data-motion="${motion}"><div class="motion-stage">${appMap(scene.rows, scene.marks, size)}${layer}</div>${program}</div>`;
}

// The duration of an action at a speed: the one chosen for the normal speed, shortened when a step
// is shorter, so that the robot still rests a moment between two steps. Tuned at every speed in
// step 14.
const actionTime = (normal, rate) => Math.min(normal, 0.8 * 1000 / rate);

// Half the width of the robot with its tracks, out of 64 for a cell, where the ring of a tool
// starts; and how far behind its center the paint taken away goes: inside its back (18.75 from its
// center), where its rounded corners still cover the whole width of the stroke.
const ROBOT_HALF = 21;
const ROBOT_CLEAN = 14;
// The shade of the ring of the eraser put down, the one of the dimmed eyes.
const ERASER_SHADE = "#7d8798";

// The time `pick_up()` and `drop()` take at the normal speed: longer than a move, since the item
// goes from the floor to the bay or back, and they are rarer; it still leaves the robot a moment of
// rest in a step of 500 ms.
const CARRY_TIME = 400;

// `pick_up()` and `drop()`, as the tab Pick up and drop says. A pose gives, beside the place of
// the robot: how far its pincer is out (`pincer`, 0 to 1), the item in its pincer between the
// floor and the bay (`flight`: its place along the robot, in % of a cell from its center, the
// front being negative, its scale and its opacity), whether the item of the floor or of the bay
// is hidden (`floor`, `bay`: false), and the item already on the floor after a drop (`dropped`).
// The robot covers the item of its cell: only "back" moves it back to show the item.
const seg = (p, from, to) => EASINGS["in-out"](clamp01((p - from) / (to - from)));
const BAY = 11.7;
const FRONT = -34;
// How far the robot steps back, as a share of a cell (decided at step 11a): the item of its cell
// then lies that far in front of its center.
const backOff = () => 0.25;
const lifted = t => 1 + 0.15 * Math.sin(Math.PI * t);
const backedUp = (world, amount) => {
  const [dx, dy] = AHEAD[world.angle];
  return { x: world.x - dx * backOff() * amount, y: world.y - dy * backOff() * amount };
};
// Decided at step 11a: the robot steps back to show the item.
const CARRY_LOOK = "back";
const CARRY_LOOKS = {
  // The item pops into the bay, or out of it, while the pincer is out.
  // For less motion: no pincer, the item fades into the bay, or out of it.
  fade: {
    pick: (world, p) => ({ floor: false, bay: true, bayOpacity: p }),
    drop: (world, p) => ({ bay: true, bayOpacity: 1 - p, dropped: p >= 1 }),
  },
  pop: {
    pick: (world, p) => ({
      pincer: seg(p, 0, 0.35) - seg(p, 0.6, 0.95),
      floor: false,
      bay: p >= 0.65,
      flight: p >= 0.4 && p < 0.65 ? { y: BAY, scale: 0.5 * lifted((p - 0.4) / 0.25 / 2) } : null,
    }),
    drop: (world, p) => ({
      pincer: seg(p, 0, 0.35) - seg(p, 0.6, 0.95),
      bay: false,
      flight: p < 0.5 ? { y: BAY, scale: 0.5 * (1 - seg(p, 0.3, 0.5)) } : null,
      dropped: p >= 0.5,
    }),
  },
  // The item comes out at the front of the robot and goes over it into the bay, or back.
  over: {
    pick: (world, p) => {
      const t = seg(p, 0.35, 0.8);
      return {
        pincer: seg(p, 0, 0.25) - seg(p, 0.6, 0.9),
        floor: false,
        bay: p >= 0.8,
        flight: p >= 0.2 && p < 0.8 ? { y: lerp(FRONT, BAY, t), scale: lerp(1, 0.5, t) * lifted(t), opacity: seg(p, 0.2, 0.35) } : null,
      };
    },
    drop: (world, p) => {
      const t = seg(p, 0.15, 0.6);
      return {
        pincer: seg(p, 0, 0.25) - seg(p, 0.65, 0.9),
        bay: p < 0.15,
        flight: p >= 0.15 && p < 0.8 ? { y: lerp(BAY, FRONT, t), scale: lerp(0.5, 1, t) * lifted(t) * (1 - 0.1 * seg(p, 0.6, 0.8)), opacity: 1 - seg(p, 0.6, 0.8) } : null,
        dropped: p >= 0.8,
      };
    },
  },
  // The robot moves back a third of a cell, so that the item of its cell shows at its front, takes
  // it over itself into the bay, or sets it down there, then rolls back onto its cell.
  back: {
    pick: (world, p) => {
      const t = seg(p, 0.4, 0.8);
      return {
        ...backedUp(world, seg(p, 0, 0.3) - seg(p, 0.7, 1)),
        pincer: seg(p, 0.05, 0.3) - seg(p, 0.55, 0.8),
        floor: p < 0.4,
        bay: p >= 0.8,
        flight: p >= 0.4 && p < 0.8 ? { y: lerp(-100 * backOff(), BAY, t), scale: lerp(1, 0.5, t) * lifted(t) } : null,
      };
    },
    drop: (world, p) => {
      const t = seg(p, 0.25, 0.65);
      return {
        ...backedUp(world, seg(p, 0, 0.3) - seg(p, 0.7, 1)),
        pincer: seg(p, 0.05, 0.3) - seg(p, 0.6, 0.85),
        bay: p < 0.25,
        flight: p >= 0.25 && p < 0.65 ? { y: lerp(BAY, -100 * backOff(), t), scale: lerp(0.5, 1, t) * lifted(t) } : null,
        dropped: p >= 0.65,
      };
    },
  },
};

// The bump into a wall or the edge of the map, the error that stops the program: the robot goes
// forward until its front touches the border of its cell (0.2 of a cell), faster and faster, then
// comes back onto its cell, as the tab Bump says. It takes 450 ms at the normal speed: it ends
// the run, nothing waits after it. A pose may also squash the robot along its length
// (`squash`, 1 at rest) or draw a spark where it touches (`spark`, 0 to 1).
const BUMP_TIME = 450;
const TOUCH = 0.2;
const touching = p => p < 0.3 ? TOUCH * (p / 0.3) ** 2 : TOUCH * (1 - EASINGS.out(clamp01((p - 0.3) / 0.4)));
const ahead = (world, amount) => {
  const [dx, dy] = AHEAD[world.angle];
  return { x: world.x + dx * amount, y: world.y + dy * amount };
};
// The shake of an error, from `from` to the end of the action: three wobbles of 8° that die out.
const shaking = (world, p, from) => {
  const t = clamp01((p - from) / (1 - from));
  return { angle: world.angle + (p > from ? 8 * Math.sin(Math.PI * 6 * t) * (1 - t) : 0) };
};
// Decided at step 11a: the robot comes back onto its cell shaking its body.
const BUMP_LOOK = "shake";
const BUMP_LOOKS = {
  back: (world, p) => ahead(world, touching(p)),
  shake: (world, p) => ({ ...ahead(world, touching(p)), ...shaking(world, p, 0.3) }),
  squash: (world, p) => ({ ...ahead(world, touching(p)), squash: p > 0.3 && p < 0.55 ? 1 - 0.16 * Math.sin(Math.PI * (p - 0.3) / 0.25) : 1 }),
  spark: (world, p) => ({ ...ahead(world, touching(p)), spark: p > 0.28 && p < 0.7 ? (p - 0.28) / 0.42 : 0 }),
};

// The other errors of the robot: `pick_up()` with no item on its cell ("pick-empty") or with an
// item already in its bay ("pick-full"), `drop()` with nothing to drop ("drop-empty") or on a cell
// that has an item already ("drop-full"). As the tab Failed pick up and drop says: "shake", the
// shake of the bump, on its cell; "try", the robot starts the action, steps back, finds what goes
// wrong (an empty pincer, a full bay that swells, an item that can't go down and goes back), rolls
// back onto its cell, then shakes. They take 650 ms at the normal speed: nothing waits after them.
const FAIL_TIME = 650;
const tried = (world, p) => ({
  ...backedUp(world, seg(p, 0, 0.2) - seg(p, 0.45, 0.6)),
  pincer: seg(p, 0.05, 0.2) - seg(p, 0.35, 0.5),
  ...shaking(world, p, 0.6),
});
// Decided at step 11a: the robot tries, then shakes.
const FAIL_LOOK = "try";
const FAIL_LOOKS = {
  shake: { any: (world, p) => shaking(world, p, 0) },
  // For less motion: nothing on the map, the error says it.
  none: { any: () => ({}) },
  try: {
    "pick-empty": tried,
    "drop-empty": tried,
    "pick-full": (world, p) => ({ ...tried(world, p), bayScale: 0.5 * (1 + 0.3 * Math.sin(Math.PI * clamp01((p - 0.18) / 0.22))) }),
    "drop-full": (world, p) => {
      const t = seg(p, 0.12, 0.28) - seg(p, 0.3, 0.46);
      const out = p > 0.12 && p < 0.46;
      return { ...tried(world, p), bay: !out, flight: out ? { y: lerp(BAY, -12, t), scale: lerp(0.5, 0.85, t) } : null };
    },
  },
};

// The end of a run, once its last step has ended: every goal met ("success"), the eyes lit in
// yellow and a hop, as the tab Success says; a goal not met ("failure"), the eyes dimmed, a shake of
// the head, then the flags of the goals not met, as the tab Goal not met says. A hop is seen from
// above: the robot grows a little and its shadow moves away toward the bottom left, the sun being
// at the top right (`lift`, 0 on the floor). It takes 900 ms: the success panel of the level
// appears after it (specs.md, about a second). `flags` is how far the flags have come (0 to 1),
// `stars` the burst of stars around a hop (0 to 1), `scale` the robot that sags.
const END_TIME = 900;
// Decided at step 11a: one hop, and a shake of the head.
const SUCCESS_LOOK = "one";
const FAILURE_LOOK = "shake";
const hop = t => Math.sin(Math.PI * clamp01(t));
const END_LOOKS = {
  success: {
    one: (world, p) => ({ lift: hop(p / 0.55) }),
    two: (world, p) => ({ lift: 0.7 * hop(p / 0.4) + 0.5 * hop((p - 0.42) / 0.35) }),
    spin: (world, p) => ({ lift: hop(p / 0.6), angle: world.angle + 360 * seg(p, 0.05, 0.55) }),
    stars: (world, p) => ({ lift: hop(p / 0.55), stars: clamp01((p - 0.2) / 0.7) }),
    still: () => ({}),
  },
  failure: {
    shake: (world, p) => {
      const t = clamp01(p / 0.6);
      return { angle: world.angle + 12 * Math.sin(Math.PI * 4 * t) * (1 - 0.4 * t), flags: clamp01((p - 0.6) / 0.35) };
    },
    still: () => ({ flags: 1 }),
    sag: (world, p) => {
      const t = clamp01((p - 0.15) / 0.5);
      return { scale: 1 - 0.07 * seg(p, 0, 0.2), angle: world.angle + 10 * Math.sin(Math.PI * 2 * t), flags: clamp01((p - 0.6) / 0.35) };
    },
  },
};

// Less motion, for a learner who asked for it (prefers-reduced-motion). "reduced", decided at step
// 11a: the moves and the turns stay, since they are what the program does, but nothing bounces nor
// shakes: a turn without overshoot, pick_up() and drop() without the pincer, the item fading into
// the bay or out of it, the bump without its shake, an action that fails shown by its error alone,
// the end of a run with the eyes alone and the flags at once. "still", compared: no animation at
// all, the robot jumps from cell to cell and turns at once.
const LESS_MOTION = {
  reduced: { turn: "in-out", carry: "fade", bump: "back", fail: "none", end: "still" },
  still: { still: true, turn: "in-out", carry: "fade", bump: "back", fail: "none", end: "still" },
};

// The two rules of the eraser compared. "all", the rule of specs.md: a cell erased loses its paint
// and every painted passage it has, the one toward the next cell too. "crossed": the eraser takes
// away what it passes over, as the brush paints it: the cell it is on or enters, and the passage it
// crosses to enter it.
// Decided at step 11a: "crossed", drawn "under" the robot.
const ERASE_STYLE = "under";
const ERASE_RULES = { fade: "all", pull: "all", under: "crossed", scrub: "crossed", dust: "crossed", ghost: "crossed" };

// What each action does to the world once it has run (`commit`), and how it draws while it runs:
// `pose` moves or turns the robot (`p` from 0 to 1, eased by the caller with `ease`), `removes`
// lists the paint that the action takes away, drawn as the tab Erasing says, and `ring` the color
// of the ring around the robot when a tool goes down (decided: a ring, and nothing when a tool is
// lifted). An action without `pose` takes no time; an action missing here changes nothing (a line
// of computation).
const key = (x, y) => `${x},${y}`;
const passageKey = (a, b) => [a, b].sort().join(" ");
const passagesOf = (world, cell) => [...world.passages].filter(passage => passage.split(" ").includes(cell));
const cellAhead = world => {
  const [dx, dy] = AHEAD[world.angle];
  return key(world.x + dx, world.y + dy);
};
// The paint an eraser takes away from a cell, `crossed` being the passage it crossed to enter it.
const erasedFrom = (world, cell, crossed, rule) => ({
  cell,
  passages: rule === "all" ? passagesOf(world, cell) : [crossed].filter(passage => world.passages.has(passage)),
});
const toolDown = (commit, ring, removes) => ({ ease: "cue", pose: () => ({}), ring, removes, commit });
const ACTIONS = {
  forward: {
    ease: "move",
    commit(world, rule) {
      const from = key(world.x, world.y);
      const to = cellAhead(world);
      const erased = world.eraser ? erasedFrom(world, to, passageKey(from, to), rule) : null;
      [world.x, world.y] = to.split(",").map(Number);
      if (world.brush) {
        world.paint.set(to, world.brush);
        world.passages.add(passageKey(from, to));
      }
      if (erased) erase(world, erased);
    },
    pose(world, p) {
      const [dx, dy] = AHEAD[world.angle];
      return { x: world.x + dx * p, y: world.y + dy * p };
    },
    removes: (world, rule) => world.eraser
      ? erasedFrom(world, cellAhead(world), passageKey(key(world.x, world.y), cellAhead(world)), rule)
      : null,
  },
  left: { ease: "turn", commit: world => { world.angle = (world.angle + 270) % 360; }, pose: (world, p) => ({ angle: world.angle - 90 * p }) },
  right: { ease: "turn", commit: world => { world.angle = (world.angle + 90) % 360; }, pose: (world, p) => ({ angle: world.angle + 90 * p }) },
  stop: { commit: world => { world.brush = null; } },
  erase: toolDown(
    (world, rule) => { world.brush = null; world.eraser = true; erase(world, erasedFrom(world, key(world.x, world.y), null, rule)); },
    () => ERASER_SHADE,
    (world, rule) => erasedFrom(world, key(world.x, world.y), null, rule),
  ),
  "stop-erasing": { commit: world => { world.eraser = false; } },
  bump: {
    ease: "linear",
    time: BUMP_TIME,
    commit: () => {},
    pose: (world, p, looks) => BUMP_LOOKS[looks.bump](world, p),
  },
  pick: {
    ease: "linear",
    time: CARRY_TIME,
    commit: world => { world.items.delete(key(world.x, world.y)); world.carrying = true; },
    pose: (world, p, looks) => CARRY_LOOKS[looks.carry].pick(world, p),
  },
  drop: {
    ease: "linear",
    time: CARRY_TIME,
    commit: world => { world.items.add(key(world.x, world.y)); world.carrying = false; },
    pose: (world, p, looks) => CARRY_LOOKS[looks.carry].drop(world, p),
  },
};
for (const kind of ["pick-empty", "pick-full", "drop-empty", "drop-full"]) {
  ACTIONS[kind] = {
    ease: "linear",
    time: FAIL_TIME,
    commit: () => {},
    pose: (world, p, looks) => (FAIL_LOOKS[looks.fail][kind] ?? FAIL_LOOKS[looks.fail].any)(world, p),
  };
}
for (const color of Object.keys(PAINT_SHADES)) {
  ACTIONS[`paint:${color}`] = toolDown(world => { world.eraser = false; world.brush = color; world.paint.set(key(world.x, world.y), color); }, () => paintShade(color));
}

function erase(world, { cell, passages }) {
  world.paint.delete(cell);
  for (const passage of passages) world.passages.delete(passage);
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

// The paint of the world, each cell drawing its half of a passage in its own color (see map.js),
// as two lists: what stays, and what the action under way takes away (`removing`).
function paintShapes(world, removing) {
  const kept = [];
  const going = [];
  for (const passage of world.passages) {
    const [a, b] = passage.split(" ");
    for (const cell of [a, b]) {
      const color = world.paint.get(cell);
      if (!color) continue;
      // A cell that loses its paint loses its halves too, the one toward a cell ahead included.
      const crossed = removing?.passages.includes(passage) ?? false;
      const shape = { kind: "half", passage, cell, from: center(cell), to: between(center(a), center(b), 0.5), color, crossed };
      (crossed || removing?.cell === cell ? going : kept).push(shape);
    }
  }
  for (const [cell, color] of world.paint) {
    (removing?.cell === cell ? going : kept).push({ kind: "dot", cell, from: center(cell), color });
  }
  return { kept, going };
}
const drawShape = (shape, opacity = 1) => shape.kind === "dot" ? dot(shape.from, shape.color, opacity) : segment(shape.from, shape.to, shape.color, "butt", opacity);

// The paint taken away while the action runs, at `p`, as the tab Erasing says:
// - "fade": it fades;
// - "pull": the robot rolls over the paint of its cell, and each passage pulls back toward the cell
//   at its other end, as if the stroke were drawn back in;
// - "under", "scrub", "dust" and "ghost": it stays until the back of the robot has passed over it,
//   so that the floor comes out clean from under the robot, as the stroke comes out of it when it
//   paints; "ghost" leaves a faint trace that fades, "dust" a few specks of the paint, and "scrub"
//   shakes the robot a little (in its pose). The half of the cell erased toward a cell ahead, which
//   the robot never covers whole, fades at the end of the move.
function drawRemoving(world, going, removing, p, style, clip) {
  if (!going.length) return "";
  if (style === "fade") return going.map(shape => drawShape(shape, 1 - p)).join("");
  if (style === "pull") {
    const shapes = going.filter(shape => shape.kind === "dot").map(shape => drawShape(shape));
    for (const passage of removing.passages) {
      const [a, b] = passage.split(" ");
      const [lost, kept] = a === removing.cell ? [a, b] : [b, a];
      const [from, to, middle] = [center(lost), center(kept), between(center(lost), center(kept), 0.5)];
      const tip = between(from, to, p);
      if (p < 0.5 && world.paint.get(lost)) shapes.push(segment(tip, middle, world.paint.get(lost), "round"));
      if (world.paint.get(kept)) shapes.push(segment(p < 0.5 ? middle : tip, to, world.paint.get(kept), "round"));
    }
    return shapes.join("");
  }
  const cut = `<clipPath id="${clip.id}"><rect x="${clip.x}" y="${clip.y}" width="${clip.width}" height="${clip.height}"/></clipPath>`;
  const covered = going.filter(shape => shape.kind === "dot" || shape.crossed);
  // The half toward the cell ahead fades only once the robot is almost on its cell.
  const late = p < 0.7 ? 1 : (1 - p) / 0.3;
  let shapes = going.filter(shape => !covered.includes(shape)).map(shape => drawShape(shape, late)).join("");
  shapes += `${cut}<g clip-path="url(#${clip.id})">${covered.map(shape => drawShape(shape)).join("")}</g>`;
  if (style === "ghost") shapes = `<g opacity="${0.3 * (1 - p)}">${covered.map(shape => drawShape(shape)).join("")}</g>` + shapes;
  if (style === "dust" && p > 0 && p < 1) {
    // Specks of the paint left behind the back of the robot, drifting apart as they fade.
    const color = paintShade(going[0].color);
    const { back, along, across } = clip;
    for (let index = 0; index < 6; index += 1) {
      const behind = 4 + index * 5 + 10 * p;
      const side = (index % 2 ? 1 : -1) * (5 + index * 2.5) * (0.4 + p);
      const [x, y] = [back[0] - along[0] * behind + across[0] * side, back[1] - along[1] * behind + across[1] * side];
      shapes += `<circle cx="${x}" cy="${y}" r="${3.5 - index * 0.3}" fill="${color}" opacity="${(1 - p) * 0.9}"/>`;
    }
  }
  return shapes;
}

let motionGeneration = 0;
let motionClips = 0;

function playScene(root) {
  const generation = motionGeneration;
  const scene = SCENES[root.dataset.scene];
  const rate = Number(root.dataset.rate);
  const size = Number(root.dataset.size);
  const paintLayer = root.querySelector(".motion-layer svg");
  const itemsLayer = root.querySelector(".motion-items");
  const robot = root.querySelector(".motion-robot");
  const overLayer = root.querySelector(".motion-over");
  const flagsLayer = root.querySelector(".motion-flags");
  const lines = root.querySelectorAll(".motion-code li");
  const status = root.querySelector(".motion-status");
  const period = 1000 / rate;
  // Less motion, for a learner who asked for it, as the tab Motion says (see LESS_MOTION).
  const motion = root.dataset.motion;
  const less = LESS_MOTION[motion] ?? {};
  const timed = time => less.still ? 0 : actionTime(time, rate);
  const durations = { move: timed(MOVE_TIME), [CARRY_TIME]: timed(CARRY_TIME), [BUMP_TIME]: timed(BUMP_TIME), [FAIL_TIME]: timed(FAIL_TIME) };
  const easings = {
    move: EASINGS[root.dataset.move || MOVE_EASE],
    turn: EASINGS[root.dataset.turn || less.turn || TURN_EASE],
    cue: EASINGS["in-out"],
  };
  const style = root.dataset.erase || ERASE_STYLE;
  const looks = {
    carry: root.dataset.carry || less.carry || CARRY_LOOK,
    bump: root.dataset.bump || less.bump || BUMP_LOOK,
    fail: root.dataset.fail || less.fail || FAIL_LOOK,
    success: root.dataset.success || less.end || SUCCESS_LOOK,
    failure: root.dataset.failure || less.end || FAILURE_LOOK,
  };
  const rule = ERASE_RULES[style];
  const clipId = `motion-clip-${motionClips += 1}`;
  const [width, height] = [scene.rows[0].length * 64, scene.rows.length * 64];
  const steps = scene.trace.length;
  let world;
  let applied;
  let start;
  const reset = now => { world = startWorld(scene); applied = 0; start = now; heard.clear(); };
  // The sounds of the scene, at their time from its start: a move or a turn as it starts, faster
  // when the step is shorter; a bump when the front of the robot touches the border of its cell;
  // the end of a run when its last step has ended. They play once, after a click on the button ▶ of
  // the scene, never as it loops.
  const moveRate = MOVE_TIME / Math.max(durations.move, 1);
  const cues = [
    ...scene.trace.flatMap(([, name], index) =>
      name === "bump" ? [[index * period + 0.3 * durations[BUMP_TIME], "bump"]]
      : name === "forward" ? [[index * period, "move", { part: "forward", rate: moveRate }]]
      : name === "left" || name === "right" ? [[index * period, "move", { part: "turn", rate: moveRate }]]
      : []),
    ...["success", "failure"].includes(scene.end) ? [[steps * period, scene.end]] : [],
  ];
  const heard = new Set();
  let armed = false;
  root.playWithSound = () => { start = undefined; armed = true; };

  const frame = now => {
    if (generation !== motionGeneration || !root.isConnected) return;
    if (start === undefined) reset(now);
    const elapsed = now - start - LEAD;
    // The step under way, started at its own time, and how far its action has gone.
    const current = elapsed < 0 ? -1 : Math.min(Math.floor(elapsed / period), steps);
    if (elapsed > steps * period + END_HOLD) { armed = false; reset(now); requestAnimationFrame(frame); return; }
    cues.forEach(([time, kind, options], index) => {
      if (armed && elapsed >= time && !heard.has(index)) playSound(kind, undefined, options);
      if (elapsed >= time) heard.add(index);
    });
    while (applied < Math.min(current, steps)) {
      ACTIONS[scene.trace[applied][1]]?.commit(world, rule);
      applied += 1;
    }
    const action = current >= 0 && current < steps ? ACTIONS[scene.trace[current][1]] : undefined;
    const duration = action?.time ? durations[action.time] : durations.move;
    const progress = action?.pose && duration > 0 ? clamp01((elapsed - current * period) / duration) : 1;
    const eased = action?.pose ? (easings[action.ease] ?? EASINGS.linear)(progress) : 1;
    const pose = { x: world.x, y: world.y, angle: world.angle, pincer: 0, floor: true, bay: true, flight: null, dropped: false, ...action?.pose?.(world, eased, looks) };
    const ended = current >= steps;
    if (ended && ["success", "failure"].includes(scene.end)) {
      world.lit = scene.end;
      const look = END_LOOKS[scene.end][looks[scene.end]];
      Object.assign(pose, look(world, clamp01((elapsed - steps * period) / END_TIME)));
    }

    const removing = action?.removes?.(world, rule) ?? null;
    // A robot that scrubs shakes a little while it moves with its eraser down.
    if (removing && style === "scrub" && action === ACTIONS.forward) pose.angle += 6 * Math.sin(progress * Math.PI * 6) * Math.sin(progress * Math.PI);
    // The region ahead of the back of the robot, where the paint taken away still shows.
    const along = AHEAD[world.angle];
    const back = [pose.x * 64 + 32 - along[0] * ROBOT_CLEAN, pose.y * 64 + 32 - along[1] * ROBOT_CLEAN];
    const clip = {
      id: clipId, back, along, across: [along[1], along[0]],
      x: along[0] > 0 ? back[0] : 0, width: along[0] > 0 ? width - back[0] : along[0] < 0 ? back[0] : width,
      y: along[1] > 0 ? back[1] : 0, height: along[1] > 0 ? height - back[1] : along[1] < 0 ? back[1] : height,
    };
    const { kept, going } = paintShapes(world, removing);
    let paint = kept.map(shape => drawShape(shape)).join("") + drawRemoving(world, going, removing, progress, style, clip);
    // The stroke laid behind the robot, from the center of the cell it leaves to its own center.
    if (action === ACTIONS.forward && world.brush) {
      paint += segment(center(key(world.x, world.y)), center(key(pose.x, pose.y)), world.brush, "round");
    }
    // The ring of a tool put down, growing from under the robot as it fades.
    const ring = action?.ring?.(world);
    if (ring && progress < 1) {
      const [x, y] = center(key(world.x, world.y));
      paint += `<circle cx="${x}" cy="${y}" r="${ROBOT_HALF + 16 * progress}" fill="none" stroke="${ring}" stroke-width="${5 * (1 - progress) + 1}" opacity="${1 - progress}"/>`;
    }
    // The shadow of a hop, which moves away toward the bottom left as the robot rises.
    if (pose.lift > 0) {
      const [x, y] = center(key(pose.x, pose.y));
      paint += `<rect x="${x - 16 - 7 * pose.lift}" y="${y - 18 + 7 * pose.lift}" width="32" height="36" rx="9" fill="#222935" opacity="${0.22 * (1 - 0.3 * pose.lift)}"/>`;
    }
    paintLayer.innerHTML = paint;
    // The item of the cell of the robot, hidden while its pincer holds it, or shown once it is set down.
    const here = key(world.x, world.y);
    const items = [...world.items].filter(cell => pose.floor || cell !== here);
    if (pose.dropped) items.push(here);
    itemsLayer.innerHTML = items.map(cell => {
      const [x, y] = cell.split(",").map(Number);
      return `<img src="${element("item")}" alt="" style="transform:translate(${x * size}px,${y * size}px)">`;
    }).join("");
    const grown = (pose.scale ?? 1) * (1 + 0.16 * (pose.lift ?? 0));
    robot.style.transform = `translate(${pose.x * size}px, ${pose.y * size}px) rotate(${pose.angle}deg) scale(${grown}, ${grown * (pose.squash ?? 1)})`;
    // A spark where the front of the robot touches the border of its cell, over the robot: four
    // short strokes flying along the wall and back from it.
    let over = "";
    if (pose.spark) {
      const [dx, dy] = AHEAD[world.angle];
      const [x, y] = [world.x * 64 + 32 + dx * 32, world.y * 64 + 32 + dy * 32];
      const from = 8 + 12 * pose.spark;
      const opacity = 1 - pose.spark ** 2;
      over = [[0, 1], [0, -1], [-0.6, 0.8], [-0.6, -0.8]].map(([back, side]) => {
        const [ux, uy] = [dx * back - dy * side, dy * back + dx * side];
        const d = `M${x + ux * from} ${y + uy * from} L${x + ux * (from + 9)} ${y + uy * (from + 9)}`;
        return `<path d="${d}" stroke="#222935" stroke-width="6" stroke-linecap="round" opacity="${opacity}"/><path d="${d}" stroke="#ffd23f" stroke-width="3.5" stroke-linecap="round" opacity="${opacity}"/>`;
      }).join("");
    }
    // The stars of a hop: six small stars that fly away from the robot as they fade.
    if (pose.stars > 0 && pose.stars < 1) {
      const [x, y] = center(key(pose.x, pose.y));
      const reach = 26 + 18 * pose.stars;
      over += Array.from({ length: 6 }, (_, index) => {
        const angle = Math.PI / 3 * index + 0.3;
        const [sx, sy] = [x + Math.cos(angle) * reach, y + Math.sin(angle) * reach];
        const r = 5 * (1 - 0.5 * pose.stars);
        return `<path d="M${sx} ${sy - r} L${sx + r * 0.3} ${sy - r * 0.3} L${sx + r} ${sy} L${sx + r * 0.3} ${sy + r * 0.3} L${sx} ${sy + r} L${sx - r * 0.3} ${sy + r * 0.3} L${sx - r} ${sy} L${sx - r * 0.3} ${sy - r * 0.3} Z" fill="#ffd23f" stroke="#222935" stroke-width="1" opacity="${1 - pose.stars ** 2}"/>`;
      }).join("");
    }
    overLayer.innerHTML = over;
    // The flags of the goals not met, planted one after the other, over the robot.
    flagsLayer.innerHTML = (scene.missed ?? []).map((cell, index, all) => {
      const t = clamp01((pose.flags ?? 0) * all.length - index);
      if (t <= 0) return "";
      const [x, y] = cell.split(",").map(Number);
      return `<img src="${element("goal-missed")}" alt="" style="transform:translate(${x * size}px,${y * size}px) scale(${EASINGS.overshoot(t)});transform-origin:${size * 0.73}px ${size * 0.42}px">`;
    }).join("");
    // The pincer slides out from under the front of the robot; the item it holds is drawn over it.
    const pincer = pose.pincer > 0 ? `<img src="${element("pincer")}" alt="" style="transform:translateY(${(1 - pose.pincer) * 14}%)">` : "";
    const carried = world.carrying && pose.bay || action === ACTIONS.pick && pose.bay ? `<img class="is-carried" src="${element("item")}" alt="" style="${pose.bayScale ? `transform:translateY(11.7%) scale(${pose.bayScale});` : ""}opacity:${pose.bayOpacity ?? 1}">` : "";
    const eyes = world.lit ? `<img src="${element(world.lit === "success" ? "eyes-lit" : "eyes-dim")}" alt="">` : "";
    const { flight } = pose;
    const held = flight ? `<img src="${element("item")}" alt="" style="transform:translateY(${flight.y}%) scale(${flight.scale});opacity:${flight.opacity ?? 1};filter:drop-shadow(0 ${2 * (flight.scale - 0.5)}px 2px #0005)">` : "";
    robot.innerHTML = `${pincer}<img src="${element("robot")}" alt="">${carried}${eyes}${held}`;

    // The highlighted line is the one of the next step: it moves on once the action of the step
    // has ended, so that a line stays lit while the robot does what it says (decided at step 11a).
    const moved = current >= 0 && progress >= 1;
    const next = moved ? current + 1 : Math.max(current, 0);
    // An error marks its line once its action has ended, and the status bar names it.
    const failed = scene.end === "error" && next >= steps;
    const errorLine = scene.trace[steps - 1][0];
    lines.forEach((line, index) => {
      line.classList.toggle("is-next", next < steps && scene.trace[next][0] === index);
      line.classList.toggle("is-error", failed && index === errorLine);
    });
    const result = { success: " · map passed", failure: " · goal not met" }[scene.end] ?? "";
    if (status) {
      status.textContent = failed ? `Error at line ${errorLine + 1} · ${steps} steps` : ended ? `Ended${result} · ${steps} steps` : `Running · ${next} steps`;
      status.classList.toggle("is-error", failed);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function startScenes() {
  motionGeneration += 1;
  document.querySelectorAll(".motion-scene").forEach(playScene);
}
AFTER_RENDER.push(startScenes);
