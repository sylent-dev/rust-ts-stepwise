// Section (step 11a): pick_up() and drop(), with the pincer that comes out of the front of the robot.

SCENES.carrying = {
  rows: ["#######", "#.....#", "#######"],
  marks: { "4,1": { goalItem: true } },
  items: ["2,1"],
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "forward()",
    "pick_up()",
    "forward()",
    "forward()",
    "drop()",
    "forward()",
  ],
  trace: [[0, "forward"], [1, "pick"], [2, "forward"], [3, "forward"], [4, "drop"], [5, "forward"]],
};

const CARRY_TITLES = { pop: "23. In the bay", over: "24. Over the robot", back: "25. Step back" };

SECTIONS.push(["Animations: picking up and dropping", () => `
  <p>Decided: <b>the robot steps back</b> (25) a third of a cell, so that the item of its cell shows at its front; its pincer takes it over the robot into the bay, or sets it down there, then the robot rolls back onto its cell. It takes 400 ms at the normal speed, a little longer than a move: the item travels, and these actions are rarer.</p>
  ${motionScene("carrying", { size: 80 })}
  <h3>Compared: 23. In the bay, 24. Over the robot, 25. Step back</h3>
  <div class="page-row">${Object.entries(CARRY_TITLES).map(([carry, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("carrying", { size: 48, code: false, carry })}</div>`).join("")}</div>`]);
