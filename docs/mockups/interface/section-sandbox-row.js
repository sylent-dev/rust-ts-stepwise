// Section: a decision of step 13b. In the sandbox, the menu Level keeps the row Sandbox, "the current
// screen" (specs.md), which doesn't say what the row looks like there.
const SANDBOX_ROW = {
  check: ["3 · A check mark", ["Sandbox", "✓"]],
  greyed: ["4 · Greyed", ["Sandbox", "", true]],
  plain: ["5 · A plain row", ["Sandbox"]],
};

// The menu Level of the sandbox: what belongs to a goal is gone.
const sandboxLevelRows = row => [["All levels"], row, null, ["Restore starting code…"]];

SECTIONS.push(["The row Sandbox of the menu Level, in the sandbox", () => `
  <p class="sandbox-row-intro">In the sandbox, the menu <b>Level</b> keeps <b>All levels</b>, <b>Sandbox</b> and <b>Restore starting code…</b>. The learner is already in the sandbox: <b>3</b> says so with the check mark of the speed in use in the menu <b>Run</b>, and choosing the row only closes the menu; <b>4</b> greys it, as <b>Next level</b> until the level is done; <b>5</b> leaves a row as the others, which leads to the screen already shown.</p>
  <div class="page-row">
    <div class="page-slot"><span>${SANDBOX_ROW[chosen.sandboxRow][0]}: 1280 × 720, the sandbox, its menu Level open</span>${sandboxWindow({ robot: "3,3", facing: "east", state: "Ready", steps: 0, console: '<span class="app-weak">Run your program to see what it prints.</span>', header: { menu: "Level" }, overlay: appDropdown(MENU_LEFT.Level, sandboxLevelRows(SANDBOX_ROW[chosen.sandboxRow][1])) })}</div>
  </div>
  <h3>The three, side by side</h3>
  <div class="menu-boards">${Object.values(SANDBOX_ROW).map(([title, row]) => `<div><span class="controls-board-title">${title}</span><div class="app-window menu-board sandbox-row-board">${appDropdown(0, sandboxLevelRows(row), undefined, 0)}</div></div>`).join("")}</div>`]);
