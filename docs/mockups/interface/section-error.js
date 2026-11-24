// Section: an error while running. With paint_side(5), the fifth forward() meets the wall in 14
// steps: the robot stands against it, its path painted. A breakpoint on the line of the error
// stands beside its cross.
SECTIONS.push(["Error while running", () => `<div class="page-row"><div class="page-slot"><span>1280 × 720, the robot against the wall, a breakpoint beside the cross</span>${appWindow({
  header: {},
  editor: { lines: SAMPLE_CODE(5), error: 5, breakpoints: [5], state: "Error at line 5", tone: "failed", steps: 14, cursor: "Ln 5, Col 9" },
  map: appWorld({ painted: ["2,1", "3,1", "4,1", "5,1", "6,1"], robot: "6,1", facing: "east" }),
  panels: { tab: "Console", dot: true, content: appConsoleError("Ln 5", "The robot bumped into a wall.", "forward() needs a free cell in front of the robot.") },
})}</div></div>`]);
