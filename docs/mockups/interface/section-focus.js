// Section: the keyboard focus, open decision of step 12a. The ring is drawn on several elements of
// each window at once, to compare them; a real screen shows one. Every window is live: Tab moves
// the real focus.
const withFocus = (html, selectors) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const selector of selectors) {
    const element = template.content.querySelector(selector);
    if (element) element.classList.add("is-focused");
    else console.error(`Keyboard focus: nothing matches ${selector}`);
  }
  return template.innerHTML;
};

SECTIONS.push(["Keyboard focus", () => `
  <p class="focus-intro">The ring that shows what the keys act on, for a learner who uses <b>Tab</b> rather than the mouse; a click never shows it. Each window draws it on several elements at once, to compare: a real screen shows one. Click in a window, then press Tab, to move the real focus.</p>
  <div class="page-row">
    <div class="page-slot"><span>1280 × 720, the level screen: a menu, the gear, Run, a tab of the map, Legend, a tab of the panels, the number of the level</span>${withFocus(readyWindow(), [".app-menu:nth-child(3)", ".app-gear", ".app-control", ".app-map-tab:nth-child(2)", ".app-chip", ".app-tab:nth-child(2)", ".app-level-mark"])}</div>
    <div class="page-slot"><span>1280 × 720, the goal: Let's go on the amber, a link on its dark side, the cross</span>${withFocus(firstVisitWindow(), [".goal-go", ".goal-link", ".app-goal .app-close"])}</div>
    <div class="page-slot"><span>1280 × 720, the settings: the theme chosen, filled with the color of the text, Off, Clear all progress</span>${withFocus(readyWindow({ header: { settings: true }, overlay: appSettings() }), ['[data-settings-theme] button[aria-pressed="true"]', '[data-settings-sounds] button[aria-pressed="true"]', ".settings-clear"])}</div>
    <div class="page-slot"><span>1280 × 720, the home screen: a level done, the level to play, a level locked, a map, Play</span>${withFocus(homeWindow(), [".home-stone.is-done", ".home-stone.is-play", ".home-stone.is-locked", ".home-map", ".home-play"])}</div>
    <div class="page-slot"><span>1280 × 720, the manual: the button back, a section, a line of On this page</span>${withFocus(manualWindow(), [".manual-back", ".manual-sections a:nth-child(4)", ".manual-toc a:nth-of-type(3)"])}</div>
  </div>`]);
