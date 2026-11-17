// Section: a decision of step 13b, removed once made. Many commands of the menus are coded by a
// later step: do their rows wait for it, or do they all show now, greyed? The windows are the top of
// the level screen as step 13b leaves it: the name, the menus, the title of the level, and nothing
// under the header yet.
const STEP_CODED = ["All levels", "Sandbox", "Manual"];

// `names` are the menus of the bar and `open` the one whose `rows` show. A menu opens under its
// name, which sits where the menu of the same rank sits in the full bar.
const stepWindow = (names, open, rows) => `<div class="app-window step-rows-window">
    <header class="app-header">
      ${appWordmark(21)}
      <nav class="app-menus">${names.map(name => `<button type="button" class="app-menu ${name === open ? "is-open" : ""}">${name}</button>`).join("")}</nav>
      <div class="app-place"><b>${SAMPLE_PLACE.title}</b></div>
    </header>
    <div class="app-block step-rows-screen"></div>
    ${appDropdown(Object.values(MENU_LEFT)[names.indexOf(open)], rows)}
  </div>`;

// Every row of the mock-up, the ones that no step has coded yet greyed.
const stepGreyedRows = name => appMenuRows(name).map(row => row && [row[0], row[1], !STEP_CODED.includes(row[0])]);

const stepRowsBoards = () => chosen.rows === "arrive"
  ? [
    ["1 · Level: the two commands that exist", stepWindow(["Level", "Help"], "Level", [["All levels"], ["Sandbox"]])],
    ["1 · Help: the manual", stepWindow(["Level", "Help"], "Help", [["Manual"]])],
  ]
  : Object.keys(MENU_LEFT).map(name => [`2 · ${name}`, stepWindow(Object.keys(MENU_LEFT), name, stepGreyedRows(name))]);

SECTIONS.push(["Step 13b: the rows of a menu not coded yet", () => `
  <p class="step-rows-intro">A decision of step 13b, not a design: the menus end as the section <b>The four menus</b> draws them. Until then, most of their commands wait for a later step: <b>Edit</b> for the editor (step 16), <b>Run</b> for the running (step 17), <b>Goal</b>, <b>Previous level</b> and <b>Next level</b> for the list of the levels (step 21). <b>1</b>: a row arrives with the step that codes its command, so a greyed row keeps one meaning, <i>not now</i>, as <b>Next level</b> until the level is done. <b>2</b>: every row shows now, greyed until its step. Each window is the top of the level screen at the end of step 13b.</p>
  <div class="page-row">${stepRowsBoards().map(([title, board]) => `<div class="page-slot"><span>${title}</span>${board}</div>`).join("")}</div>`]);
