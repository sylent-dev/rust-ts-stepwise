// Section (step 11a): the end of a run, every goal met or a goal not met.

// Stand in the slot at the end of the row; for the second scene, also paint the middle cell red.
const END_ROWS = ["#####", "#...#", "#####"];
SCENES.success = {
  rows: END_ROWS,
  marks: { "3,1": { goalStand: true } },
  robot: { x: 1, y: 1, dir: "east" },
  program: ["forward()", "forward()"],
  trace: [[0, "forward"], [1, "forward"]],
  end: "success",
};
SCENES.failure = {
  rows: END_ROWS,
  marks: { "2,1": { goalPaint: "red" }, "3,1": { goalStand: true } },
  robot: { x: 1, y: 1, dir: "east" },
  program: ["forward()", "forward()"],
  trace: [[0, "forward"], [1, "forward"]],
  end: "failure",
  missed: ["2,1"],
};

const SUCCESS_TITLES = { one: "32. One hop", two: "33. Two hops", spin: "34. Hop and spin", stars: "35. Hop and stars" };
const FAILURE_TITLES = { shake: "36. Shake its head", sag: "37. Sag and shake" };

SECTIONS.push(["Animations: the end of a run", () => `
  <p>Decided, once the last step has ended: every goal met, the eyes light up in yellow and the robot <b>hops once</b> (32), seen from above as a robot that grows a little while its shadow moves away toward the bottom left (the sun is at the top right); a goal not met, the eyes dim and the robot <b>shakes its head</b> (36), slower and wider than the shake of an error, then the flags of the goals not met are planted one after the other. Each takes 900 ms; the success panel of the level appears after it, the real celebration.</p>
  <div class="page-row">
    <div class="page-slot"><span>Every goal met</span>${motionScene("success", { size: 80 })}</div>
    <div class="page-slot"><span>The red cell not painted</span>${motionScene("failure", { size: 80 })}</div>
  </div>
  <h3>Success compared: 32. One hop, 33. Two hops, 34. Hop and spin, 35. Hop and stars</h3>
  <div class="page-row">${Object.entries(SUCCESS_TITLES).map(([success, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("success", { size: 56, code: false, success })}</div>`).join("")}</div>
  <h3>Goal not met compared: 36. Shake its head, 37. Sag and shake</h3>
  <div class="page-row">${Object.entries(FAILURE_TITLES).map(([failure, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("failure", { size: 56, code: false, failure })}</div>`).join("")}</div>`]);
