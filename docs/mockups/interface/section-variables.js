// Section: every state of the variables panel, each in a block at its real size, numbered once.
const DEEP_CALLS = [["main program", 14], ["paint_square", 9], ["paint_side", 5]];
// A text is written as in a program, between its quotes; the bridge gives its first 200 characters, and
// the panel writes `…` after them when it cut it. A value stays on one line, cut at the edge of the panel,
// as a name longer than 24 characters is.
const LONG_TEXT_SHOWN = 200;
const LONG_TEXT = `"Sides done:${Array.from({ length: 80 }, (_, index) => ` ${index + 1}`).join("")}"`;
const LONG_TEXT_VALUE = LONG_TEXT.length > LONG_TEXT_SHOWN ? LONG_TEXT.slice(0, LONG_TEXT_SHOWN) + "…" : LONG_TEXT;

const variablesBoards = () => [
  ["Nothing yet", '<span class="app-weak">Pause the program to see its variables.</span>'],
  ["In the main program", appVariables("the main program", [["sides", "1"]], [["main program", 10]])],
  ["Inside a function", appVariables("paint_side", [["length", "3"]], [["main program", 10], ["paint_side", 5]])],
  ["A value changed by the last step", appVariables("the main program", [["sides", "2", true]], [["main program", 13]])],
  ["Every kind of value", appVariables("the main program", [["count", "12"], ["done", "true"], ["paint", "red"], ["title", '"Sides done:"']], [["main program", 8]])],
  ["A long text, a long name, a line break", appVariables("the main program", [["count", "12"], ["title", LONG_TEXT_VALUE, true], ["two_lines", '"Sides\\ndone"'], ["the_number_of_cells_painted_so_far", "9"]], [["main program", 8]])],
  ["A call without variables yet", appVariables("paint_corner", [], [["main program", 12], ["paint_corner", 3]], 1, '<span class="app-weak">No variables yet.</span>')],
  ["Several calls in progress", appVariables("paint_side", [["length", "3"], ["color", "red"]], DEEP_CALLS)],
  ["Another call chosen: its variables", appVariables("paint_square", [["side", "3"]], DEEP_CALLS, 1)],
  ["The state at an error", appVariables("paint_side", [["length", "5"]], [["main program", 10], ["paint_side", 5]])],
];

SECTIONS.push(["The states of the variables panel", () => `<div class="console-boards">${variablesBoards().map(([title, content], index) => `
  <div><span class="console-board-title">${index + 1} · ${title}</span><div class="app-window console-board">${appPanels({ tab: "Variables", content })}</div></div>`).join("")}</div>`]);
