// Section: after the command menu has inserted a statement that opens a block (`if |:` and its line),
// how the learner goes from the place to fill in to the line of the block, decided at step 20a: Tab
// or Enter goes on to the next place, and at the last one they are Tab and Enter again (rather than
// Tab alone, as in VS Code, or Enter that finishes the line). A live editor: a button plays the menu
// inserting a command. Enter keeps the rules of the editor: the indentation of its
// line, four spaces more after a `:`, the line finished when only closing signs follow the cursor;
// `(` comes with its `)`, which a `)` typed passes over.

// The places to fill in are marked by `|`, in order; the line of a block is the last one.
const FILL_SNIPPETS = {
  "if": "if |:\n    |",
  "while": "while |:\n    |",
  "repeat": "repeat |:\n    |",
  "function": "function |(|):\n    |",
  "let": "let | = |",
  "start_painting(color)": "start_painting(|)",
};
const FILL_BEFORE = "let sides = 0\n";
const FILL_AFTER = "\nprint(\"Done\")";

// The text of the editor, the places still to fill in and the one where the cursor is.
const fillState = { text: "", fields: [], index: 0 };

// What a snippet inserts, and its places.
function fillSnippet(name) {
  const snippet = FILL_SNIPPETS[name];
  const [first, ...parts] = snippet.split("|");
  const fields = [];
  let text = first;
  for (const part of parts) {
    fields.push(text.length);
    text += part;
  }
  return { text, fields: fields.map(at => ({ from: at, to: at })) };
}

function fillInsert(name) {
  const area = document.querySelector(".commands-fill-code");
  const { text, fields } = fillSnippet(name);
  const shift = FILL_BEFORE.length;
  fillState.text = FILL_BEFORE + text + FILL_AFTER;
  fillState.fields = fields.map(({ from, to }) => ({ from: from + shift, to: to + shift }));
  fillState.index = 0;
  area.value = fillState.text;
  area.focus();
  area.setSelectionRange(fillState.fields[0].from, fillState.fields[0].to);
  // A single place has nowhere to go next.
  if (fillState.fields.length < 2) fillState.fields = [];
}

// Replaces the selection with `inserted` and puts the cursor `caret` characters into it.
function fillWrite(area, inserted, caret = inserted.length) {
  const { selectionStart: start, selectionEnd: end } = area;
  area.setRangeText(inserted, start, end, "end");
  area.setSelectionRange(start + caret, start + caret);
  fillFollow(area);
}

// Follows a change of the text with the places: the place where the cursor is grows, those after it move.
function fillFollow(area) {
  const before = fillState.text, after = area.value;
  fillState.text = after;
  if (!fillState.fields.length) return;
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let endBefore = before.length, endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) { endBefore -= 1; endAfter -= 1; }
  const delta = endAfter - endBefore;
  fillState.fields = fillState.fields.map((field, index) => {
    if (index === fillState.index && start >= field.from && endBefore <= field.to) return { from: field.from, to: field.to + delta };
    if (field.from >= endBefore && index > fillState.index) return { from: field.from + delta, to: field.to + delta };
    return field;
  });
  fillCheck(area);
}

// The places end once the cursor leaves the one it is in.
function fillCheck(area) {
  const field = fillState.fields[fillState.index];
  if (field && (area.selectionStart < field.from || area.selectionEnd > field.to)) fillState.fields = [];
}

// Goes to the next place, whose text is selected; the last one ends the places.
function fillNext(area) {
  fillState.index += 1;
  const field = fillState.fields[fillState.index];
  area.setSelectionRange(field.from, field.to);
  if (fillState.index === fillState.fields.length - 1) fillState.fields = [];
}

function fillEnter(area) {
  const text = area.value;
  const at = area.selectionStart;
  const lineStart = text.lastIndexOf("\n", at - 1) + 1;
  const lineEnd = text.indexOf("\n", at) === -1 ? text.length : text.indexOf("\n", at);
  const rest = text.slice(at, lineEnd);
  // Only closing signs after the cursor: the line is finished as it is.
  const finishes = /^[)"]+\s*$/.test(rest);
  const breakAt = finishes ? lineEnd : at;
  area.setSelectionRange(breakAt, breakAt);
  const line = text.slice(lineStart, breakAt);
  const indent = line.match(/^ */)[0].length + (/:\s*(#.*)?$/.test(line) ? 4 : 0);
  fillWrite(area, "\n" + " ".repeat(indent));
}

document.addEventListener("keydown", event => {
  const area = event.target;
  if (!area.matches?.(".commands-fill-code")) return;
  const more = fillState.fields.length > 0 && fillState.index < fillState.fields.length - 1;
  if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey) {
    event.preventDefault();
    if (more) return fillNext(area);
    const column = area.selectionStart - area.value.lastIndexOf("\n", area.selectionStart - 1) - 1;
    fillWrite(area, " ".repeat(4 - (column % 4)));
  } else if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
    event.preventDefault();
    if (more) return fillNext(area);
    fillEnter(area);
  } else if (event.key === "(") {
    event.preventDefault();
    fillWrite(area, "()", 1);
  } else if (event.key === ")" && area.value[area.selectionStart] === ")" && area.selectionStart === area.selectionEnd) {
    event.preventDefault();
    area.setSelectionRange(area.selectionStart + 1, area.selectionStart + 1);
    fillCheck(area);
  } else if (event.key === "Escape") {
    fillState.fields = [];
  }
});
document.addEventListener("input", event => { if (event.target.matches?.(".commands-fill-code")) fillFollow(event.target); });
for (const type of ["mouseup", "keyup"]) {
  document.addEventListener(type, event => {
    if (event.target.matches?.(".commands-fill-code") && !["Tab", "Enter"].includes(event.key)) fillCheck(event.target);
  });
}
document.addEventListener("click", event => {
  const name = event.target.closest?.("[data-fill-insert]")?.dataset.fillInsert;
  if (name) fillInsert(name);
});

SECTIONS.push(["Command menu: from the place to fill in to the block", () => `
  <div class="commands-fill-intro">The menu inserts <code>if</code> with its colon and the line of its block, the cursor on the condition (<code>if |:</code>). Once the condition is typed, the learner goes on to the line of the block. Try it:
    <ol><li>Click a button: it plays the menu inserting that command, on the second line.</li>
    <li>Type what goes in the place, <code>front_is_clear()</code> for <code>if</code>.</li>
    <li>Go on to the block, then type <code>forward()</code> in it.</li></ol>
    <p>Tab or Enter goes on to the next place; at the last place, they are Tab and Enter again (decided at step 20a, against Tab alone, as in VS Code, and against Enter that finishes the line). The places are not drawn; the colors of the code are left out here.</p></div>
  <div class="commands-fill-inserts"><span>Insert:</span>${Object.keys(FILL_SNIPPETS).map(name => `<button type="button" data-fill-insert="${name}">${name}</button>`).join("")}</div>
  <div class="app-window commands-fill-board"><textarea class="commands-fill-code" spellcheck="false" aria-label="Code">${FILL_BEFORE}${FILL_AFTER}</textarea></div>`]);
