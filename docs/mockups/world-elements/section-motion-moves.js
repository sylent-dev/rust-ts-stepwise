// Section (step 11a): the easing of a move and of a turn, at the normal speed.

const EASE_TITLES = { "in-out": "Smooth", linear: "Even", out: "Quick start", overshoot: "Overshoot" };

SECTIONS.push(["Animations: moving and turning", () => `
  <p>How the robot starts and stops in a move (tab <b>Move</b>) and in a turn (tab <b>Turn</b>), in 300 ms at the normal speed. <b>Smooth</b> starts and stops gently; <b>Even</b> keeps one pace, like a machine; <b>Quick start</b> leaves at once and slows down at the end; <b>Overshoot</b> goes a little past the cell or the quarter turn, then settles back.</p>
  ${motionScene("square", { size: 96 })}
  <h3>The four easings side by side, the same for a move and a turn</h3>
  <div class="page-row">${Object.entries(EASE_TITLES).map(([ease, title], index) => `<div class="page-slot"><span>${index + 1} and ${index + 5}. ${title}</span>${motionScene("square", { size: 48, code: false, move: ease, turn: ease })}</div>`).join("")}</div>`]);
