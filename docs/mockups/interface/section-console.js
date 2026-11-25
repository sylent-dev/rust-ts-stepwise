// Section: every element of the console, each in a block at its real size, numbered once.
const CONSOLE_PRINTS = ["Sides done: 1", "Sides done: 2", "Sides done: 3", "Sides done: 4"];
const CONSOLE_LONG = Array.from({ length: 30 }, (_, index) => `Step ${index + 1}`);
// A print in a loop that never ends: the console keeps its last 1,000 lines, and says above them
// that the earlier ones aren't shown, so that the memory of the page never fills up.
const CONSOLE_KEPT = 1000;
const CONSOLE_ENDLESS = Array.from({ length: CONSOLE_KEPT }, (_, index) => `Turns: ${index + 2418}`);
const consoleCut = () => `<div class="console-cut app-weak">Earlier lines are not shown: the console keeps the last 1,000.</div>`;

const consoleBoards = () => [
  ["Nothing yet", { content: '<span class="app-weak">Run your program to see what it prints.</span>' }],
  ["The lines of print", { content: consolePrints(...CONSOLE_PRINTS) }],
  ["Every kind of value, and a long line", { content: consolePrints("3 true red", "x: 12 y: 4", "A long line goes on to the next one without leaving the block, and nothing has to scroll sideways to read it.") }],
  ["A long output: the last lines in sight", { content: consoleLast(consolePrints(...CONSOLE_LONG)) }],
  ["A print that never ends: the last 1,000 lines (scroll up)", { content: consoleLast(consoleCut() + consolePrints(...CONSOLE_ENDLESS)) }],
  ["A syntax error, before running", { content: appConsoleError("Ln 9", "Expected ':' at the end of the line.", "A line that opens a block, with if, else, while, repeat or function, ends with ':'.") + consoleFix(1) }],
  ["Several errors, before running", { content: [
    appConsoleError("Ln 8", "The name sids does not exist.", "A variable is declared with let before it is used."),
    appConsoleError("Ln 10", "paint_side takes 1 value, not 2.", "A call gives one value for each parameter of the function."),
    appConsoleError("Ln 14", "paintSide is not in snake_case.", "Names use lowercase letters from a to z, digits and underscores, and start with a letter."),
    consoleFix(3),
  ].join("") }],
  ["An error while running, after some lines", { dot: true, content: consolePrints("Sides done: 1") + appConsoleError("Ln 5", "The robot bumped into a wall.", "forward() needs a free cell in front of the robot.") }],
  ["A value that can't be used", { dot: true, content: appConsoleError("Ln 6", "The program divided by zero.", "/ needs a number other than 0 on its right.") }],
  ["Too many calls", { dot: true, content: appConsoleError("Ln 3", "200 calls in progress: the limit is reached.", "A function that calls itself needs a case where it does not.") }],
  ["A goal not met", { content: consolePrints(...CONSOLE_PRINTS) + consoleGoal("The goal is not met: 7 cells are not red.") }],
  ["Several goals not met", { content: [consoleGoal("The goal is not met: 7 cells are not red."), consoleGoal("The goal is not met: the robot is not in the right place.")].join("") }],
  ["A map passed, others remain", { content: consolePrints(...CONSOLE_PRINTS) + consolePassed("Map 1 passed. Try map 2.") }],
  ["The last map passed", { content: consolePassed("Map 3 passed. Level done!") }],
];

SECTIONS.push(["The elements of the console", () => `<div class="console-boards">${consoleBoards().map(([title, panel], index) => `
  <div><span class="console-board-title">${index + 1} · ${title}</span><div class="app-window console-board">${appPanels({ tab: "Console", ...panel })}</div></div>`).join("")}</div>`]);
