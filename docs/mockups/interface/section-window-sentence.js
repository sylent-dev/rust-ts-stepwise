// Section: what the message of a window too small tells the learner to do, to decide at step 13d. On a
// laptop of 1366 × 768, the bars of the browser and of the system leave about 1366 × 650 to the page:
// wide enough, not high enough, and its window can't grow. "Widen the window" is of no use there: only
// the zoom and the full screen help. Each proposal is shown in both cases: a window that can still
// grow on its screen, and that laptop.
const WINDOW_FIXES = {
  one: ["Enlarge the window, or zoom out with Ctrl and −.", "Enlarge the window, or zoom out with Ctrl and −."],
  full: ["Enlarge the window, zoom out with Ctrl and −, or press F11 for the full screen.", "Enlarge the window, zoom out with Ctrl and −, or press F11 for the full screen."],
  follows: ["Enlarge the window, or zoom out with Ctrl and −.", "Zoom out with Ctrl and −, or press F11 for the full screen."],
};
const WINDOW_FIX_NOTES = {
  one: "10 · one sentence for every case, with a verb that holds for the width and for the height",
  full: "11 · one sentence for every case, which also names the full screen",
  follows: "12 · the sentence follows the window: the page knows whether the window already fills its screen, and only says what can be done",
};

SECTIONS.push(["To decide · What a window too small can do", () => `<div class="page-row">
  <div class="page-slot"><span>${WINDOW_FIX_NOTES[chosen.windowfix]}. 1024 × 640, a window that can still grow on its screen</span>${messageWindow("small", [1024, 640], WINDOW_FIXES[chosen.windowfix][0])}</div>
  <div class="page-slot"><span>1366 × 650, a laptop of 1366 × 768 whose window already fills the screen: the bars of the browser and of the system take the rest</span>${messageWindow("small", [1366, 650], WINDOW_FIXES[chosen.windowfix][1])}</div>
</div>`]);
