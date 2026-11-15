// Section (step 11a): the bump into a wall, the error that stops the program.

SCENES.bumping = {
  rows: ["#####", "#...#", "#####"],
  robot: { x: 1, y: 1, dir: "east" },
  program: [
    "forward()",
    "forward()",
    "forward()",
  ],
  trace: [[0, "forward"], [1, "forward"], [2, "bump"]],
  end: "error",
};

const BUMP_TITLES = { back: "26. Back", shake: "27. Back and shake", squash: "28. Squash", spark: "29. Spark" };

SECTIONS.push(["Animations: bumping into a wall", () => `
  <p>Decided: a <code>forward()</code> toward a wall or the edge of the map, which stops the program, sends the robot forward until its front touches the border of its cell, faster and faster; it comes back onto its cell <b>shaking its body</b> a little (27), and stays there, the line of the error marked and the status bar in the error color. It takes 450 ms at the normal speed: nothing waits after it. The sound of the bump comes in step 11b.</p>
  ${motionScene("bumping", { size: 80 })}
  <h3>Compared: 26. Back, 27. Back and shake, 28. Squash, 29. Spark</h3>
  <div class="page-row">${Object.entries(BUMP_TITLES).map(([bump, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("bumping", { size: 56, code: false, bump })}</div>`).join("")}</div>`]);
