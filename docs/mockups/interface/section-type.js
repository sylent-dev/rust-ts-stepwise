// Section: the typography, decided at step 12b. One board per kind of token of typography.css (the sizes,
// the weights, the line heights), one row per token: its samples in the fonts that use it, and what
// it is for.

const typeValue = token => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
const typeBoard = rows => `<div class="app-window type-board">${rows.map(([token, samples, uses]) => `<div class="type-row">
    <code>${token}</code>
    <small><b>${typeValue(token)}</b></small>
    <div class="type-samples">${samples}</div>
    <span class="type-uses">${uses}</span>
  </div>`).join("")}</div>`;
// A sample: the font of its role (text, name or code), its weight, its size, its words.
const typeSample = (font, weight, size, words, more = "") =>
  `<span style="font:var(--weight-${weight}) var(--size-${size}) var(--font-${font});${more}">${words}</span>`;

const TYPE_SIZES = [
  ["label", [["text", "strong", "ON THIS PAGE"], ["text", "strong", "NEW"]],
    "The title of a group, in capitals: the chapter above the name of a level, <i>New</i>, a group of shortcuts or of results."],
  ["small", [["text", "text", "37 steps · Ln 5, Col 9"], ["text", "text", "Ctrl+Enter"]],
    "What comes second: the status bar, a shortcut beside its command, a sentence under a name."],
  ["text", [["text", "text", "Run your program to see what it prints."], ["text", "control", "Level   Edit   Run   Help"]],
    "The text of the interface: the menus, the tabs, the buttons, the sentences."],
  ["code-small", [["code", "code", "Sides done: 2"], ["code", "code", "sides = 2"]],
    "The code in the denser panels: the console, the variables, an example of the command menu."],
  ["code", [["code", "code", "function paint_side(length):"], ["code", "code-strong", "forward()"]],
    "The code: the editor, the list of the command menu, the examples of the manual."],
  ["lead", [["text", "text", "Moves the robot one cell forward."], ["text", "strong", "Paint a square"]],
    "What is read at length (the manual, a message in place of the screen), what names a zone (the level, a chapter), a large button."],
  ["title", [["name", "strong", "Let’s go"], ["text", "strong", "Keyboard shortcuts"], ["code", "code", "function  while"]],
    "The title of a panel or of a goal, a question, <i>Let’s go</i>, the level chosen on the home screen, a section of the manual, the words used by a level done."],
  ["display", [["name", "strong", "Level 18 done!"], ["text", "strong", "2. Commands"]],
    "The title of a page, a great moment."],
].map(([size, samples, uses]) => [`--size-${size}`,
  samples.map(([font, weight, words]) => typeSample(font, weight, size, words, size === "label" ? "letter-spacing:var(--tracking-label)" : "")).join(""), uses]);

const TYPE_WEIGHTS = [
  ["text", typeSample("text", "text", "text", "Paint a red square of side 3, starting where the robot stands."),
    "What is read: a sentence, a shortcut, the status bar."],
  ["control", typeSample("text", "control", "text", "Level   Edit   Run   Help") + typeSample("text", "control", "text", "Show hint") + typeSample("text", "control", "text", "Map 2"),
    "What is clicked: a menu, a tab, a small button, a link of the manual where the reader is."],
  ["strong", typeSample("text", "strong", "text", "Paint a square") + typeSample("text", "strong", "label", "ON THIS PAGE", "letter-spacing:var(--tracking-label)") + typeSample("name", "strong", "title", "Let’s go"),
    "What stands out: a title, a title in capitals, a main button, what is chosen or shown, a word of a sentence. The font of the name has no other weight."],
  ["code", typeSample("code", "code", "code", "sides = sides + 1"),
    "The code."],
  ["code-strong", typeSample("code", "code-strong", "code", "forward()") + typeSample("code", "code-strong", "code-small", "sides = 2"),
    "The code that stands out: the name of a command, the number of the line of the next step, a value that has just changed, the call in progress."],
].map(([weight, samples, uses]) => [`--weight-${weight}`, samples, uses]);

const typeLines = (line, font, weight, size, words) => `<span style="display:block;line-height:var(--line-${line});font-family:var(--font-${font});font-weight:var(--weight-${weight});font-size:var(--size-${size})">${words}</span>`;
const TYPE_LINES = [
  ["title", typeLines("title", "text", "strong", "title", "Restore the starting code<br>of 18. Paint a square?"),
    "A title, a name that may take two lines, a row of the legend."],
  ["text", typeLines("text", "text", "text", "text", "Paint a red square of side 3, starting where the robot<br>stands. Write one side as a function, then call it."),
    "The text of the interface."],
  ["reading", typeLines("reading", "text", "text", "lead", "The built-in functions move the robot, paint, carry an item,<br>look around the robot and write in the console."),
    "What is read at length: the manual, a message in place of the screen."],
  ["code", typeLines("code", "code", "code", "code", "repeat 3:<br>    forward()"),
    "The code of the editor, of the command menu and of the examples of the manual."],
  ["code-small", typeLines("code-small", "code", "code", "code-small", "Sides done: 1<br>Sides done: 2"),
    "The code of the denser panels: the console, the variables."],
].map(([line, samples, uses]) => [`--line-${line}`, samples, uses]);

SECTIONS.push(["Typography", () => `
  <p class="type-intro">Three fonts, each with one role: <b>Fredoka</b> for the personality, <b>Manrope</b> for the interface, <b>Source Code Pro</b> for the code. Their sizes, their weights and their line heights are a few tokens, each with a role, so that a new screen picks one of them instead of adding its own: the mock-up had 23 sizes, each text sized on its own.</p>
  <h3>The scale of the sizes</h3>
  ${typeBoard(TYPE_SIZES)}
  <p class="type-intro">The code has two sizes: the editor, and the denser panels. The name <i>stepwise</i> keeps its own size, with the logo.</p>
  <h3>The weights</h3>
  ${typeBoard(TYPE_WEIGHTS)}
  <h3>The line heights</h3>
  ${typeBoard(TYPE_LINES)}
  <p class="type-intro">A text of one line centered in its box (the name, a menu, the number of a level) has a line height of 1.</p>`]);
