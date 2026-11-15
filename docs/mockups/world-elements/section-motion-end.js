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
  <p>Once the last step has ended. Every goal met, tab <b>Success</b>: the eyes light up in yellow and the robot hops, seen from above as a robot that grows a little while its shadow moves away toward the bottom left (the sun is at the top right); <b>32</b> one hop, <b>33</b> two smaller hops, <b>34</b> a full turn in the air, <b>35</b> a burst of small yellow stars. A goal not met, tab <b>Goal not met</b>: the eyes dim and the robot shakes its head, slower and wider than the shake of an error, then the flags of the goals not met are planted one after the other; <b>36</b> a shake of the head, <b>37</b> the robot sags a little before. Each takes 900 ms; the success panel of the level appears after it.</p>
  <div class="page-row">
    <div class="page-slot"><span>Every goal met</span>${motionScene("success", { size: 80 })}</div>
    <div class="page-slot"><span>The red cell not painted</span>${motionScene("failure", { size: 80 })}</div>
  </div>
  <h3>Success compared</h3>
  <div class="page-row">${Object.entries(SUCCESS_TITLES).map(([success, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("success", { size: 56, code: false, success })}</div>`).join("")}</div>
  <h3>Goal not met compared</h3>
  <div class="page-row">${Object.entries(FAILURE_TITLES).map(([failure, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("failure", { size: 56, code: false, failure })}</div>`).join("")}</div>`]);
