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
  <p>For a learner who asked their system for less motion. Tab <b>Motion</b>: <b>Full</b> is what the other sections decided; <b>38</b> keeps the moves and the turns, since they are what the program does, but nothing bounces nor shakes: a turn without overshoot, <code>pick_up()</code> and <code>drop()</code> in place (the item pops into the bay or out of it), the bump without its shake, the end of a run with the eyes alone and the flags at once; <b>39</b> has no animation at all: the robot jumps from cell to cell and turns at once.</p>
  <div class="page-row">
    <div class="page-slot"><span>Every gesture</span>${motionScene("tour", { size: 64, motion: "tab" })}</div>
    <div class="page-slot"><span>A bump</span>${motionScene("bumping", { size: 64, motion: "tab" })}</div>
    <div class="page-slot"><span>A goal not met</span>${motionScene("failure", { size: 64, motion: "tab" })}</div>
  </div>`]);
