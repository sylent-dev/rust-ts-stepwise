// Section (step 11a): the normal speed, the one of a first visit, and how long a move or a turn
// takes at that speed. The scene of the square is shared with the next sections.

const SQUARE_RING = ["1,1", "2,1", "3,1", "3,2", "3,3", "2,3", "1,3", "1,2"];
SCENES.square = {
  rows: ["#####", "#...#", "#...#", "#...#", "#####"],
  marks: Object.fromEntries(SQUARE_RING.map(cell => [cell, { goalPaint: "blue" }])),
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "start_painting(blue)",
    "repeat 4:",
    "    forward()",
    "    forward()",
    "    turn_right()",
    "stop_painting()",
  ],
  // The steps, as [line, action]: the line of `repeat` is a step at each turn, and a last time.
  trace: [
    [0, "paint:blue"],
    ...Array.from({ length: 4 }, () => [[1], [2, "forward"], [3, "forward"], [4, "right"]]).flat(),
    [1],
    [5, "stop"],
  ],
  end: "success",
};

SECTIONS.push(["Animations: the normal speed", () => `
  <p>Decided: the speed of a first visit is <b>2 steps per second</b>, and a move or a turn takes <b>300 ms</b> at that speed, so that the robot rests 200 ms between two steps. The highlighted line is the one of the next step: it moves on once the action of the step has ended, so that a line stays lit while the robot does what it says.</p>
  ${motionScene("square", { size: 64 })}
  <h3>The four animated speeds side by side</h3>
  <p>A step shorter than the move shortens it, so that the robot rests a moment between two steps; the tuning at every speed is left to step 14.</p>
  <div class="page-row">${SPEEDS_ANIMATED.map(rate => `<div class="page-slot"><span>${rate} step${rate > 1 ? "s" : ""} per second · ${Math.round(actionTime(MOVE_TIME, rate))} ms</span>${motionScene("square", { rate, size: 32 })}</div>`).join("")}</div>`]);
