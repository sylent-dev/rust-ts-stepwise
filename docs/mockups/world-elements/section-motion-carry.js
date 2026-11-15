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
  <p>The robot covers the item of its cell, and its pincer comes out of its front (<code>specs.md</code>), so the item has to go from the floor to the bay at its back, or back. Tab <b>Pick up and drop</b>: <b>23</b> the pincer comes out and the item pops into the bay, or out of it; <b>24</b> the item comes out at the front of the robot and goes over it into the bay, or back, then under the robot; <b>25</b> the robot moves back a third of a cell, so that the item shows at its front, takes it over itself into the bay, or sets it down there, then rolls back onto its cell. Each takes 400 ms at the normal speed, a little longer than a move.</p>
  ${motionScene("carrying", { size: 80 })}
  <h3>Compared</h3>
  <div class="page-row">${Object.entries(CARRY_TITLES).map(([carry, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("carrying", { size: 48, code: false, carry })}</div>`).join("")}</div>`]);
