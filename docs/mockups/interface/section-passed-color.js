// Section: what has passed, in green and in teal as today, in teal alone, or in green alone; open
// decision of step 12a. The green is the bar of the progress and the line of the console; the teal
// is the tab of a map, the status bar, a level done. First strips of the same window one under the
// other, each in its variant, then whole windows that follow the tabs of the page.
const PASSED_COLORS = VARIANTS.passed.options;

const passedSample = () => passedWindow({ maps: { shown: 1, passed: [1] }, state: "Ended · map 1 passed", message: "Map 1 passed. Try map 2." });
// A strip of a window: `height` pixels of it, from `top`.
const passedStrip = (variant, content, top, height) => `<div class="page-slot passed-slot"><span>${PASSED_COLORS[variant]}</span>
  <div class="passed-strip passed-is-${variant}" style="height:${height}px"><div style="margin-top:${-top}px">${content}</div></div></div>`;
const passedStrips = (content, top, height) => Object.keys(PASSED_COLORS).map(variant => passedStrip(variant, content(), top, height)).join("");

SECTIONS.push(["Passed: green, teal, or both", () => `
  <p class="focus-intro">What has passed has two colors today: the bar of the progress and the line of the console are green, the tab of a map, the status bar and a level done are teal, the color of the item. Each strip below is the same window in one variant; the whole windows at the end follow the tabs <b>Passed</b> at the top of the page.</p>
  <h3>The top of the level screen: the bar of the progress, the tab of a map passed</h3>
  ${passedStrips(passedSample, 0, 84)}
  <h3>Its bottom: the status bar, the line of the console</h3>
  ${passedStrips(passedSample, 504, 216)}
  <h3>The home screen: the bar of the progress, the levels done</h3>
  ${passedStrips(homeWindow, 0, 250)}
  <h3>In the window, following the tabs</h3>
  <div class="page-row passed-is-${chosen.passed}">
    <div class="page-slot"><span>1280 × 720, map 1 passed</span>${passedSample()}</div>
    <div class="page-slot"><span>1280 × 720, the home screen</span>${homeWindow()}</div>
  </div>`]);
