// Section (step 11a): the easing of a move and of a turn, at the normal speed, as compared.

const EASE_TITLES = { "in-out": ["1 and 5", "Smooth"], linear: ["2 and 6", "Even"], out: ["3 and 7", "Quick start"], overshoot: ["4 and 8", "Overshoot"], "smooth-overshoot": ["9 and 10", "Smooth, then overshoot"] };

SECTIONS.push(["Animations: moving and turning", () => `
  <p>Decided: a move is <b>Smooth</b> (1), so that the robot stops clearly in the middle of its cell, where the learner counts the cells; a turn <b>overshoots</b> (8): it pivots at once, goes 5 % past the quarter turn (4.5°), then settles back, which makes the robot livelier where nothing is counted. The bump into a wall stays the only move that bounces back.</p>
  ${motionScene("square", { size: 96 })}
  <h3>The easings compared, the same for a move and a turn</h3>
  <div class="page-row">${Object.entries(EASE_TITLES).map(([ease, [numbers, title]]) => `<div class="page-slot"><span>${numbers}. ${title}</span>${motionScene("square", { size: 48, code: false, move: ease, turn: ease })}</div>`).join("")}</div>`]);
