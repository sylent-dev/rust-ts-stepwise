// Section: the spacing and the radii, decided at step 12c. One row per token of themes.css: a step
// of the scale drawn at its real length between two blocks, a radius on what it rounds, and its role.

const SPACE_STEPS = [
  [2, "The parts of one control: the menus of the header, the two values of a choice, the squares of the speed; a dense row, in the command menu and the legend; a sentence under its name."],
  [4, "A small row or a small button, above and under its text: a tab, a section of the manual, a shortcut; two tabs side by side."],
  [6, "A button and a row of a menu, above and under their text; an icon and its word; a cross and its corner."],
  [8, "Two neighbors: two buttons, two messages of the console, a title and its sentence; a field and its text; a tip and what it names."],
  [12, "The sides of a band and of its rows: the header, the status bar, a row of a menu, the code after its margin; two paragraphs."],
  [16, "The sides of a panel and of what opens over the screen: the console, the goal, the legend, the level chosen on the home screen, the side of the manual."],
  [24, "The sides of a panel in the middle of the screen: the settings, the shortcuts, a confirmation, the success panel; two groups in a row."],
  [40, "The margins of a page that is read, the manual, and what separates two of its sections."],
];

// A radius: its sample, and what it rounds.
const SPACE_RADII = [
  ["--radius", `<button class="app-chip">Legend</button><button class="app-primary">Play</button>`,
    "Everything of the interface that has corners: a button, a control, a tab, a field, a tip, a label, a row under the pointer."],
  ["--radius-mark", `<span class="app-speed"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i></i><i></i></span>`,
    "A mark smaller than a letter: a square of the speed, the square of a map under its level, a word found by the search."],
  ["--radius-bubble", `<span class="space-bubble">Paint a square</span>`,
    "What the robot says: the corners of its bubble follow the size of its text."],
];

SECTIONS.push(["Spacing and radii", () => `
  <p class="space-intro">Every padding, margin and gap of the blocks takes one of these eight steps, and so does the distance of a floating element from the edge it hangs on. They replace 34 values written one by one. The alignments tuned by eye stay as they were: the text of a link of the goal, an icon on the lowercase letters of the console, the header above the bar of the progress.</p>
  <div class="app-window space-board">${SPACE_STEPS.map(([step, uses]) => `<div class="space-row">
    <code>--space-${step}</code>
    <small><b>${step}px</b></small>
    <div class="space-sample"><i></i><b style="width:var(--space-${step})"></b><i></i></div>
    <span class="space-uses">${uses}</span>
  </div>`).join("")}</div>
  <p class="space-intro">Three radii. The zones have square corners (the blocks, the bands, the panels, the menus), a circle is <code>50%</code>, and a drawing keeps the corners of its shape: the visor of the robot, the stroke of paint of the success panel.</p>
  <div class="app-window space-board">${SPACE_RADII.map(([token, sample, uses]) => `<div class="space-row">
    <code>${token}</code>
    <small><b>${getComputedStyle(document.documentElement).getPropertyValue(token).trim()}</b></small>
    <div class="space-sample is-radius">${sample}</div>
    <span class="space-uses">${uses}</span>
  </div>`).join("")}</div>`]);
