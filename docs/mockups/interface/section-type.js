// Section: the scale of the text sizes, open at step 12b. One row per size of themes.css, with the
// sizes written by hand that it replaces, then the windows where a text moves the most. The tabs
// Text sizes, at the top of the page, apply to every window of the page.

// A sample: the font of its role (text, name or code), its weight, its words.
const TYPE_SCALE = [
  ["label", "10 · 10.5 · 11 · 11.5", [["text", 600, "ON THIS PAGE"], ["text", 700, "NEW"]],
    "The title of a group, in capitals: the chapter above the name of a level, <i>New</i>, a group of shortcuts or of results."],
  ["small", "11.5 · 12 · 12.5", [["text", 400, "37 steps · Ln 5, Col 9"], ["text", 400, "Ctrl+Enter"]],
    "What comes second: the status bar, a shortcut beside its command, a sentence under a name."],
  ["text", "13 · 13.5", [["text", 400, "Run your program to see what it prints."], ["text", 500, "Level   Edit   Run   Help"]],
    "The text of the interface: the menus, the tabs, the buttons, the sentences."],
  ["code-small", "12 · 12.5 · 13 · 13.5", [["code", 600, "Sides done: 2"], ["code", 600, "sides = 2"]],
    "The code in the denser panels: the console, the variables, an example of the command menu."],
  ["code", "13.5 · 14 · 14.5", [["code", 600, "function paint_side(length):"], ["code", 800, "forward()"]],
    "The code: the editor, the list of the command menu, the examples of the manual."],
  ["lead", "14 · 14.5 · 15 · 15.5", [["text", 400, "Moves the robot one cell forward."], ["text", 600, "Paint a square"]],
    "What is read at length (the manual, a message in place of the screen), what names a zone (the level, a chapter), a large button."],
  ["subtitle", "16 · 16.5 · 17", [["name", 600, "Paint a square"], ["text", 600, "Legend of the map"]],
    "The title of a small panel: what the robot says in the goal, the legend, the level done."],
  ["title", "18 · 19", [["name", 600, "Let's go"], ["text", 600, "Keyboard shortcuts"]],
    "The title of a panel, a question, <i>Let's go</i>, a section of the manual."],
  ["heading", "21", [["text", 600, "18. Paint a square"]],
    "The level chosen, on the home screen."],
  ["display", "25 · 26 · 27 · 28 · 30", [["name", 600, "Level 18 done!"], ["text", 600, "2. Commands"]],
    "The title of a page, a great moment."],
];

function typeBoard() {
  const sizeOf = token => getComputedStyle(document.documentElement).getPropertyValue(`--size-${token}`).trim();
  return `<div class="app-window type-board">${TYPE_SCALE.map(([token, byHand, samples, uses]) => {
    const merged = token !== "title" && sizeOf(token) === sizeOf("title");
    return `<div class="type-row">
      <code>--size-${token}</code>
      <small><b>${sizeOf(token)}</b>${merged ? ", one with the title" : ""}<br>by hand: ${byHand}</small>
      <div class="type-samples">${samples.map(([font, weight, words]) =>
        `<span style="font:${weight} var(--size-${token}) var(--font-${font})${token === "label" ? ";letter-spacing:.05em" : ""}">${words}</span>`).join("")}</div>
      <span class="type-uses">${uses}</span>
    </div>`;
  }).join("")}</div>`;
}

SECTIONS.push(["Text sizes", () => `
  <p class="type-intro">Each text of the mock-up was sized on its own: 23 sizes. A scale keeps a few, each with a role, so that a new screen picks one of them instead of adding a 24th. The tabs <b>Text sizes</b>, at the top of the page, apply to every window of the page. <b>1</b> shows the sizes written by hand. <b>2</b> is a scale of 10: no text moves by more than 1 pixel, but the great titles. <b>3</b> is a scale of 8: the three titles of 16.5, 18 and 21 pixels are one, of 18. The name <i>stepwise</i> keeps its own size, with the logo.</p>
  <h3>The scale</h3>
  ${typeBoard()}
  <h3>The windows where a text moves the most, with its size by hand</h3>
  <div class="page-row">
    <div class="page-slot"><span>1280 × 720, the goal: its title (16.5), <i>New</i> (11.5), the name of the level in the header (14)</span>${firstVisitWindow()}</div>
    <div class="page-slot"><span>1280 × 720, the success panel: its title (30), the level (16), the numbers (14.5), the words used (16.5)</span>${successOver(appSuccess(SUCCESS_SAMPLE))}</div>
    <div class="page-slot"><span>1280 × 720, the home screen: the level chosen (21), the chapters (14 and 11.5), the maps (13)</span>${homeWindow()}</div>
    <div class="page-slot"><span>1280 × 720, the manual: its text (14.5), its first sentences (15.5), a section (19), an example (13.5)</span>${manualWindow()}</div>
    <div class="page-slot"><span>1280 × 720, the command menu: its list (13.5), its example (12.5), its keys (12)</span>${readyWindow({ editor: { lines: COMMAND_LINES("        "), caret: { line: 5, col: 9 }, cursor: "Ln 5, Col 9" }, overlay: commandMenuMove() })}</div>
    <div class="page-slot"><span>1280 × 720, the legend: its title (16), <i>New</i> (10)</span>${carryWindow("open", appLegend(CARRY_ELEMENTS, ["item", "slot"]))}</div>
    <div class="page-slot"><span>1280 × 720, a message in place of the screen: its title (26)</span>${messageWindow("offline", [1280, 720])}</div>
  </div>`]);
