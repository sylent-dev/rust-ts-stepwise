// Section: the sentence of each goal not met in the console (step 21a). The core knows what each goal
// asks, never what the goals draw together (a square, a path), so a sentence names the cells by
// their number and the item slots by the name of the legend, never "of the square". One
// note per goal not met, in the order of the goals: where to stand, the paints (one note per color),
// the cells painted in excess, the item slots, what the robot carries. Decided on 2026-11-25: the
// robot "is not in the right place", shorter and plainer than "where it should stand" or "on its
// square" (read as the square painted), the flag showing the cell; the negations written in full,
// as in every text of the interface.

const goalNote = text => consoleGoal(`The goal is not met: ${text}`);
const standNote = () => goalNote("the robot is not in the right place.");

const goalNoteBoards = () => [
  ["Where to stand", standNote()],
  ["Cells not of their color", consolePrints(...CONSOLE_PRINTS) + goalNote("7 cells are not red.")],
  ["One cell", goalNote("1 cell is not red.")],
  ["Two colors: one note per color", goalNote("3 cells are not red.") + goalNote("2 cells are not blue.")],
  ["Cells painted in excess (the level asks for no other paint)", goalNote("2 cells are painted outside the goal.")],
  ["Item slots left empty", goalNote("2 item slots are empty.")],
  ["One item slot", goalNote("1 item slot is empty.")],
  ["The robot should carry an item", goalNote("the robot carries no item.")],
  ["The robot should carry none", goalNote("the robot carries an item.")],
  ["Several goals at once, in the order of the goals", [standNote(), goalNote("4 cells are not red."), goalNote("1 cell is painted outside the goal."), goalNote("1 item slot is empty.")].join("")],
];

SECTIONS.push(["Console: the goals not met", () => `
  <p class="motion-intro">One note per goal not met, in neutral words: the core knows what each goal asks, not the shape that the goals draw together, so “7 cells of the square are not red” becomes “7 cells are not red”. The item slots take the name of the legend; the robot is “not in the right place”, the flag showing the cell.</p>
  <div class="console-boards">${goalNoteBoards().map(([title, content], index) => `
    <div><span class="console-board-title">${index + 1} · ${title}</span><div class="app-window console-board">${appPanels({ tab: "Console", content })}</div></div>`).join("")}</div>`]);
