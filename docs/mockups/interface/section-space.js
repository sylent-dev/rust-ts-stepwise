// Section: the spacing, decided at step 12c. One row per step of the scale of themes.css: the step
// drawn at its real length between two blocks, and what it separates.

const SPACE_STEPS = [
  [2, "The parts of one control: the menus of the header, the two values of a choice, the squares of the speed; a dense row, in the command menu and the legend; a sentence under its name."],
  [4, "A small row or a small button, above and under its text: a tab, a section of the manual, a shortcut; two tabs side by side."],
  [6, "A button and a row of a menu, above and under their text; an icon and its word; a cross and its corner."],
  [8, "Two neighbors: two buttons, two messages of the console, a title and its sentence; a field and its text; a bubble and what it names."],
  [12, "The sides of a band and of its rows: the header, the status bar, a row of a menu, the code after its margin; two paragraphs."],
  [16, "The sides of a panel and of what opens over the screen: the console, the goal, the legend, the level chosen on the home screen, the side of the manual."],
  [24, "The sides of a panel in the middle of the screen: the settings, the shortcuts, a confirmation, the success panel; two groups in a row."],
  [40, "The margins of a page that is read, the manual, and what separates two of its sections."],
];

SECTIONS.push(["Spacing", () => `
  <p class="space-intro">Every padding, margin and gap of the blocks takes one of these eight steps, where 34 values were written one by one. The tabs <b>Spacing</b> at the top of the page compare the whole mock-up as it was (1) and on the scale (2): most texts move by 1 or 2 pixels, the page of the manual by 10, its margins being 40 on every side. The alignments tuned by eye stay as they were: the text of a link of the goal, an icon on the lowercase letters of the console, the header above the bar of the progress.</p>
  <div class="app-window space-board">${SPACE_STEPS.map(([step, uses]) => `<div class="space-row">
    <code>--space-${step}</code>
    <small><b>${step}px</b></small>
    <div class="space-sample"><i></i><b style="width:var(--space-${step})"></b><i></i></div>
    <span class="space-uses">${uses}</span>
  </div>`).join("")}</div>`]);
