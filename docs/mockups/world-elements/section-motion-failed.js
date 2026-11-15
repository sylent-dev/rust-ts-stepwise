// Section (step 11a): pick_up() and drop() that fail, the other errors of the robot.

const FAILED_ROWS = ["#####", "#...#", "#####"];
const failedScene = (program, trace, items = []) => ({ rows: FAILED_ROWS, items, robot: { x: 1, y: 1, dir: "east" }, program, trace, end: "error" });
SCENES.pickEmpty = failedScene(["forward()", "pick_up()"], [[0, "forward"], [1, "pick-empty"]]);
SCENES.pickFull = failedScene(["forward()", "pick_up()", "pick_up()"], [[0, "forward"], [1, "pick"], [2, "pick-full"]], ["2,1"]);
SCENES.dropEmpty = failedScene(["forward()", "drop()"], [[0, "forward"], [1, "drop-empty"]]);
SCENES.dropFull = failedScene(["forward()", "pick_up()", "forward()", "drop()"], [[0, "forward"], [1, "pick"], [2, "forward"], [3, "drop-full"]], ["2,1", "3,1"]);

const FAILED_SCENES = { pickEmpty: "No item to pick up", pickFull: "An item in the bay already", dropEmpty: "No item to drop", dropFull: "An item on the cell already" };

SECTIONS.push(["Animations: picking up and dropping that fail", () => `
  <p>The other errors of the robot, which stop the program as the bump does. Tab <b>Failed pick up and drop</b>: <b>30</b> the robot only shakes, on its cell, as after a bump; <b>31</b> it starts the action and steps back, finds what goes wrong (its pincer comes out empty, its full bay swells, the item it drops can't go down and goes back into the bay), rolls back onto its cell, then shakes. They take 650 ms at the normal speed: nothing waits after them.</p>
  <div class="page-row">${Object.entries(FAILED_SCENES).map(([name, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene(name, { size: 64 })}</div>`).join("")}</div>`]);
