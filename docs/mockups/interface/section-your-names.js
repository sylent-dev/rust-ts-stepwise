// Section: the category Your names of the command menu (step 20b): the variables and the functions
// of the program that can be used at the cursor, those declared above it, the functions first, then
// the variables, each in the order of the program. The details of a name give the line where it is
// declared, as the program writes it (decided on 2026-11-25, against an example of use and the
// sentence alone); a name of the program has no entry in the manual: no Read the manual. Without a
// name, a sentence takes the place of the names and of their details, without the robot: nothing
// went wrong; another one names the line of a syntax error above the cursor, which hides them.

const NAMES_DETAILS = {
  sides: { name: "sides", text: "A variable of your program, declared on line 8.", example: ["let sides = 0"] },
  paint_side: { name: "paint_side(length)", text: "A function of your program, defined on line 2.", example: ["function paint_side(length):"] },
  length: { name: "length", text: "A parameter of <code>paint_side()</code>, on line 2.", example: ["function paint_side(length):"] },
};

// The menu in the main program, under `sides = sides + 1`, and in the body of paint_side.
const NAMES_MAIN = ["paint_side(length)", "sides"];
const NAMES_FUNCTION = ["paint_side(length)", "length"];
const namesMenu = (rows, name, options) => appCommandMenu({ category: "Your names", groups: [[null, rows]], chosen: NAMES_DETAILS[name].name, details: { ...NAMES_DETAILS[name], more: false }, ...options });
const namesEmpty = sentence => appCommandMenu({ category: "Your names", groups: [], empty: sentence, robot: false, left: 0, top: 0 });

// A new line at the end of the block of the while, the cursor on it.
const namesLines = () => {
  const lines = SAMPLE_CODE();
  lines.splice(12, 0, "    ");
  return lines;
};

SECTIONS.push(["Command menu: Your names", () => `
  <div class="page-row">
    <div class="page-slot"><span>1280 × 720, Ctrl+Space on a new line of the main program</span>${readyWindow({ editor: { lines: namesLines(), caret: { line: 13, col: 5 }, cursor: "Ln 13, Col 5" }, overlay: namesMenu(NAMES_MAIN, "sides", { left: 99, top: 340 }) })}</div>
  </div>
  <h3>The panel alone</h3>
  <div class="commands-boards">${[
    ["In the main program: a variable", namesMenu(NAMES_MAIN, "sides", { left: 0, top: 0 })],
    ["In the main program: a function", namesMenu(NAMES_MAIN, "paint_side", { left: 0, top: 0 })],
    ["In the body of paint_side: its parameter", namesMenu(NAMES_FUNCTION, "length", { left: 0, top: 0 })],
    ["Nothing declared above the cursor", namesEmpty("Your variables and functions appear here once they are declared above the cursor.")],
    ["A syntax error above the cursor", namesEmpty("Your variables and functions appear here once the error on line 3 is fixed.")],
  ].map(([title, panel]) => `<div><span class="controls-board-title">${title}</span><div class="app-window commands-board">${panel}</div></div>`).join("")}</div>`]);
