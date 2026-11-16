// Section: the typography, decided at step 12b. The scale of the text sizes, one row per size of
// themes.css: its samples in the fonts that use it, and what it is for.

// A sample: the font of its role (text, name or code), its weight, its words.
const TYPE_SCALE = [
  ["label", [["text", 600, "ON THIS PAGE"], ["text", 700, "NEW"]],
    "The title of a group, in capitals: the chapter above the name of a level, <i>New</i>, a group of shortcuts or of results."],
  ["small", [["text", 400, "37 steps · Ln 5, Col 9"], ["text", 400, "Ctrl+Enter"]],
    "What comes second: the status bar, a shortcut beside its command, a sentence under a name."],
  ["text", [["text", 400, "Run your program to see what it prints."], ["text", 500, "Level   Edit   Run   Help"]],
    "The text of the interface: the menus, the tabs, the buttons, the sentences."],
  ["code-small", [["code", 600, "Sides done: 2"], ["code", 600, "sides = 2"]],
    "The code in the denser panels: the console, the variables, an example of the command menu."],
  ["code", [["code", 600, "function paint_side(length):"], ["code", 800, "forward()"]],
    "The code: the editor, the list of the command menu, the examples of the manual."],
  ["lead", [["text", 400, "Moves the robot one cell forward."], ["text", 600, "Paint a square"]],
    "What is read at length (the manual, a message in place of the screen), what names a zone (the level, a chapter), a large button."],
  ["title", [["name", 600, "Let's go"], ["text", 600, "Keyboard shortcuts"], ["code", 600, "function  while"]],
    "The title of a panel or of a goal, a question, <i>Let's go</i>, the level chosen on the home screen, a section of the manual, the words used by a level done."],
  ["display", [["name", 600, "Level 18 done!"], ["text", 600, "2. Commands"]],
    "The title of a page, a great moment."],
];

function typeBoard() {
  const sizeOf = token => getComputedStyle(document.documentElement).getPropertyValue(`--size-${token}`).trim();
  return `<div class="app-window type-board">${TYPE_SCALE.map(([token, samples, uses]) => `<div class="type-row">
      <code>--size-${token}</code>
      <small><b>${sizeOf(token)}</b></small>
      <div class="type-samples">${samples.map(([font, weight, words]) =>
        `<span style="font:${weight} var(--size-${token}) var(--font-${font})${token === "label" ? ";letter-spacing:.05em" : ""}">${words}</span>`).join("")}</div>
      <span class="type-uses">${uses}</span>
    </div>`).join("")}</div>`;
}

SECTIONS.push(["Typography", () => `
  <p class="type-intro">The scale of the text sizes: eight sizes, each with a role, so that a new screen picks one of them instead of adding its own. The mock-up had 23, each text sized on its own. The code has two: the editor, and the denser panels. The name <i>stepwise</i> keeps its own size, with the logo.</p>
  <h3>The scale</h3>
  ${typeBoard()}`]);
