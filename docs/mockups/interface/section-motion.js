// Section: the motion of the interface, decided at step 12d. One row per token of motion.css, in
// the styles of the application: a duration played at its real length, a curve drawn and played over
// one second, and its role. Every board switches between two states every two seconds, and its
// samples follow with their tokens.

// A duration: its token, its sample, and what it times.
const MOTION_DURATIONS = [
  ["fade", `<span class="motion-stone"><b>18</b></span>`,
    "What gives way under the pointer: the number of the level to play under the face of the robot, the shadow of a level done."],
  ["appear", `<span class="motion-pop"></span>`,
    "What appears, or goes back to rest: the face of the robot on the level to play, <b>Unlock</b> turning amber, a bubble of the manual, the success panel; the paint leaving a main button; the fill of a choice of the settings, sliding to the other one."],
  ["stroke", `<span class="motion-stroke"><b>Let’s go</b></span>`,
    "The robot crossing a main button under the pointer, its paint behind it: <b>Let’s go</b>, <b>Unlock</b>, the way back from the manual."],
  ["flash", `<span class="motion-flash">forward()</span>`,
    "What lights up to be noticed, then fades: the place reached in the manual; the status bar when the learner types in an editor that is locked."],
];

// A curve: its token, its two control points (those of motion.css, to draw it), and what moves so.
const MOTION_CURVES = [
  ["appear", [0, 0, .58, 1], "What arrives or fades: fast at first, then settling."],
  ["pop", [.3, 1.6, .5, 1], "What pops: it goes past its size and comes back, as the robot goes past its quarter turn."],
  ["stroke", [.35, .05, .4, 1], "The brush: it sets off gently, crosses fast and settles."],
  ["move", [.42, 0, .58, 1], "What goes from a place to another, starting and stopping gently, as the robot moves forward: the robot of the home screen, the head of the success panel."],
];

const motionValue = token => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
const motionRow = (token, sample, uses) => `<div class="motion-row">
    <code>${token}</code>
    <small><b>${motionValue(token)}</b></small>
    <div class="motion-sample">${sample}</div>
    <span class="motion-uses">${uses}</span>
  </div>`;

// The curve drawn from its start, at the bottom left, to its end: time goes right, the move goes up.
const motionGraph = ([x1, y1, x2, y2]) => {
  const x = value => 6 + value * 48;
  const y = value => 50 - value * 32;
  return `<svg class="motion-graph" viewBox="0 0 60 56" width="60" height="56" aria-hidden="true">
    <path class="motion-axis" d="M6 ${y(1)}H54M6 ${y(0)}H54"/>
    <path d="M${x(0)} ${y(0)}C${x(x1)} ${y(y1)} ${x(x2)} ${y(y2)} ${x(1)} ${y(1)}"/></svg>`;
};

SECTIONS.push(["Motion", () => `
  <p class="motion-intro">Four durations and four curves time what moves in the interface; they replace a dozen values written one by one. What answers the learner is there at once: a fill under the pointer, and what they open or close, a menu, a bubble, a panel, the drawer of the manual. The scenes keep a timing of their own: the robot of the home screen, the success panel, the examples of the manual, the two seconds of <b>Clear all progress</b>. For a learner who asked for less motion, nothing moves: only a change of tone stays, the flash and the bar of <b>Clear all progress</b>.</p>
  <h3>The durations</h3>
  <div class="app-window motion-board">${MOTION_DURATIONS.map(([name, sample, uses]) => motionRow(`--duration-${name}`, sample, uses)).join("")}</div>
  <h3>The curves, each over one second</h3>
  <div class="app-window motion-board">${MOTION_CURVES.map(([name, points, uses]) =>
    motionRow(`--ease-${name}`, `${motionGraph(points)}<span class="motion-track"><i style="transition-timing-function:var(--ease-${name})"></i></span>`, uses)).join("")}</div>`]);

// The samples play in a loop: every board goes from one state to the other.
setInterval(() => document.querySelectorAll(".motion-board").forEach(board => board.classList.toggle("is-on")), 2000);
