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

SECTIONS.push(["Animations: painting and erasing", () => `
  <p>The robot covers its cell, so the paint that <code>start_painting()</code> puts there can't be seen, and lifting a tool changes nothing on the map: tab <b>Tool down</b> for <code>start_painting()</code> and <code>start_erasing()</code> (the ring takes the color of the paint, or the gray of the dimmed eyes for the eraser), tab <b>Tool up</b> for <code>stop_painting()</code> and <code>stop_erasing()</code>. The brush and the eraser themselves are never shown (decided on 2026-11-04).</p>
  <p>The eraser takes away the paint of each cell it enters, with the passages of that cell: the one toward the next cell too, which leaves the paint of that cell alone until the robot enters it. Tab <b>Erasing</b>: the paint taken away <b>fades</b>, or the robot rolls over the paint of its cell and the passages <b>pull back</b> toward the cells that keep their paint. A tool down or up takes 300 ms when it is animated; the line moves on at once otherwise.</p>
  <div class="page-row">
    <div class="page-slot"><span>Painting</span>${motionScene("painting", { size: 64 })}</div>
    <div class="page-slot"><span>Erasing</span>${motionScene("erasing", { size: 64 })}</div>
  </div>
  <h3>Tool down compared</h3>
  <div class="page-row">${Object.entries({ none: "11. Nothing", press: "12. Press", ripple: "13. Ring", both: "14. Press and ring" }).map(([down, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("painting", { size: 40, code: false, down })}</div>`).join("")}</div>
  <h3>Erasing compared</h3>
  <div class="page-row">${Object.entries({ fade: "17. Fade", pull: "18. Pull back" }).map(([erase, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("erasing", { size: 40, code: false, erase })}</div>`).join("")}</div>`]);
