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
  <p>A <code>forward()</code> toward a wall or the edge of the map stops the program: the robot goes forward until its front touches the border of its cell, faster and faster, then comes back onto its cell, where it stays, the line of the error marked and the status bar in the error color. Tab <b>Bump</b>: <b>26</b> nothing more; <b>27</b> it shakes its body a little as it comes back; <b>28</b> it squashes against the wall; <b>29</b> a small spark flies where it touches. It takes 450 ms at the normal speed: nothing waits after it. The sound of the bump comes in step 11b.</p>
  ${motionScene("bumping", { size: 80 })}
  <h3>Compared</h3>
  <div class="page-row">${Object.entries(BUMP_TITLES).map(([bump, title]) =>
    `<div class="page-slot"><span>${title}</span>${motionScene("bumping", { size: 56, code: false, bump })}</div>`).join("")}</div>`]);
