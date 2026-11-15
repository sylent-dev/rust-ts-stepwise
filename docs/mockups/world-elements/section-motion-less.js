// Section (step 11a): less motion, for a learner who asked for it in their system
// (prefers-reduced-motion).

// Paint the two blue cells, then bring the item to its slot: every gesture of a run that succeeds.
SCENES.tour = {
  rows: ["######", "#....#", "#....#", "######"],
  marks: { "1,1": { goalPaint: "blue" }, "2,1": { goalPaint: "blue" }, "1,2": { goalItem: true } },
  items: ["2,2"],
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "start_painting(blue)",
    "forward()",
    "stop_painting()",
    "turn_right()",
    "forward()",
    "pick_up()",
    "turn_right()",
    "forward()",
    "drop()",
  ],
  trace: [[0, "paint:blue"], [1, "forward"], [2, "stop"], [3, "right"], [4, "forward"], [5, "pick"], [6, "right"], [7, "forward"], [8, "drop"]],
  end: "success",
};

SECTIONS.push(["Animations: less motion", () => `
  <p>Decided, for a learner who asked their system for less motion (38): the moves and the turns stay, since they are what the program does, but nothing bounces nor shakes. A turn without overshoot; <code>pick_up()</code> and <code>drop()</code> without the pincer nor the step back, the item fading into the bay or out of it; the bump without its shake; a <code>pick_up()</code> or a <code>drop()</code> that fails shown by its error alone; the end of a run with the eyes alone and the flags at once. 39, rejected, had no animation at all: at two steps per second, the eye no longer follows which action happened.</p>
  <div class="page-row">
    <div class="page-slot"><span>Every gesture</span>${motionScene("tour", { size: 64, motion: "reduced" })}</div>
    <div class="page-slot"><span>A bump</span>${motionScene("bumping", { size: 64, motion: "reduced" })}</div>
    <div class="page-slot"><span>A goal not met</span>${motionScene("failure", { size: 64, motion: "reduced" })}</div>
  </div>
  <h3>Compared: full motion, 38. Less: no bounce, 39. Less: none</h3>
  <div class="page-row">${[["full", "Full"], ["reduced", "38. Less: no bounce"], ["still", "39. Less: none"]].map(([motion, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("tour", { size: 48, code: false, motion })}</div>`).join("")}</div>`]);
