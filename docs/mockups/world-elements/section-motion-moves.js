// Section (step 11a): the easing of a move and of a turn, at the normal speed.

const EASE_TITLES = { "in-out": ["1 and 5", "Smooth"], linear: ["2 and 6", "Even"], out: ["3 and 7", "Quick start"], overshoot: ["4 and 8", "Overshoot"], "smooth-overshoot": ["9 and 10", "Smooth, then overshoot"] };

SECTIONS.push(["Animations: moving and turning", () => `
  <p>How the robot starts and stops in a move (tab <b>Move</b>) and in a turn (tab <b>Turn</b>), in 300 ms at the normal speed. <b>Smooth</b> starts and stops gently; <b>Even</b> keeps one pace, like a machine; <b>Quick start</b> leaves at once and slows down at the end; <b>Overshoot</b> leaves at once, goes a little past the cell or the quarter turn, then settles back; <b>Smooth, then overshoot</b> leaves gently, goes past and settles back as gently. The slider <b>Overshoot</b> sets how far past, as a share of a cell or of a quarter turn (5 % is 3 px of a cell of 64 px, and 4.5°).</p>
  ${motionScene("square", { size: 96 })}
  <h3>The four easings side by side, the same for a move and a turn</h3>
  <div class="page-row">${Object.entries(EASE_TITLES).map(([ease, [numbers, title]]) => `<div class="page-slot"><span>${numbers}. ${title}</span>${motionScene("square", { size: 48, code: false, move: ease, turn: ease })}</div>`).join("")}</div>`]);
