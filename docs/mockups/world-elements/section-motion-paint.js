// Section (step 11a): putting the brush or the eraser down, lifting it, and the paint taken away by
// the eraser.

// A row of five floor cells, painted in red at the start of the scene of the eraser.
const PAINT_ROWS = ["#######", "#.....#", "#######"];
const PAINT_ROW = ["1,1", "2,1", "3,1", "4,1", "5,1"];

SCENES.painting = {
  rows: PAINT_ROWS,
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "start_painting(red)",
    "forward()",
    "forward()",
    "stop_painting()",
    "forward()",
    "start_painting(blue)",
    "forward()",
  ],
  trace: [[0, "paint:red"], [1, "forward"], [2, "forward"], [3, "stop"], [4, "forward"], [5, "paint:blue"], [6, "forward"]],
};

SCENES.erasing = {
  rows: PAINT_ROWS,
  paint: Object.fromEntries(PAINT_ROW.map(cell => [cell, "red"])),
  passages: pathLinks(...PAINT_ROW),
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "start_erasing()",
    "forward()",
    "forward()",
    "stop_erasing()",
    "forward()",
  ],
  trace: [[0, "erase"], [1, "forward"], [2, "forward"], [3, "stop-erasing"], [4, "forward"]],
};

// An L painted in blue, erased along its long side: a turn shows what the eraser leaves at a corner.
const ERASE_L = ["1,1", "2,1", "3,1", "4,1", "4,2", "4,3"];
SCENES.erasingCorner = {
  rows: ["######", "#....#", "#....#", "#....#", "######"],
  paint: Object.fromEntries(ERASE_L.map(cell => [cell, "blue"])),
  passages: pathLinks(...ERASE_L),
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "start_erasing()",
    "repeat 3:",
    "    forward()",
    "stop_erasing()",
  ],
  trace: [[0, "erase"], [1], [2, "forward"], [1], [2, "forward"], [1], [2, "forward"], [1], [3, "stop-erasing"]],
};

const ERASE_TITLES = { fade: "17. Fade", pull: "18. Pull back", under: "19. Under the robot", scrub: "20. Scrub", dust: "21. Dust", ghost: "22. Ghost" };

SECTIONS.push(["Animations: painting and erasing", () => `
  <p>Decided: a tool put down (<code>start_painting()</code>, <code>start_erasing()</code>) shows a <b>ring</b> growing from under the robot, in the color of the paint or in the gray of the dimmed eyes for the eraser, since the robot covers the paint of its cell; a tool lifted shows <b>nothing</b>. The brush and the eraser themselves are never shown (decided on 2026-11-04).</p>
  <p>Decided, the eraser: <b>it takes away what it passes over</b> (19), as the brush paints it: the cell it is on or enters, and the passage it crosses to enter it, no longer every passage of the cell as <code>specs.md</code> said (17 and 18), which took the paint ahead away before the robot reached it. The paint goes under the robot and the floor comes out clean behind it, with nothing more; the stroke ahead ends square at the border of the cell. A cell erased alone keeps its passages, so a stroke joins it again if it is painted again.</p>
  <div class="page-row">
    <div class="page-slot"><span>Painting</span>${motionScene("painting", { size: 64 })}</div>
    <div class="page-slot"><span>Erasing</span>${motionScene("erasing", { size: 64 })}</div>
    <div class="page-slot"><span>Erasing up to a corner</span>${motionScene("erasingCorner", { size: 64 })}</div>
  </div>
  <h3>Erasing compared: 17 and 18 with the rule of specs.md, 19 to 22 with the new one</h3>
  <div class="page-row">${Object.entries(ERASE_TITLES).map(([erase, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("erasing", { size: 40, code: false, erase })}</div>`).join("")}</div>`]);
