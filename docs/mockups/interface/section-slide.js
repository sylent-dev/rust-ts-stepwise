// Section: the slide of a choice in the settings, an open decision of step 13c. At a click on a
// segment, the fill of the choice slides to it and the two texts turn with it, as the white pill of
// the settings of Rust Exile Market. The control *Slide of a choice*, at the top of the page, compares
// its timing (section-slide.css). The window is live: click Day Desk and Night Desk, Off and On. The
// section and its control go once decided.
const SLIDE_SLOTS = {
  market: "1 · as in Rust Exile Market: 220 milliseconds, on its own curve, very fast at first, then a long settling",
  appear: "2 · with the tokens of Stepwise: 200 milliseconds (--duration-appear), fast at first, then settling (--ease-appear)",
  move: "3 · with the tokens of Stepwise: 200 milliseconds (--duration-appear), starting and stopping gently, as the robot moves (--ease-move)",
  none: "4 · at once, as before: nothing slides",
};

SECTIONS.push(["Settings: the slide of a choice", () => `<div class="page-row">
  <div class="page-slot"><span>1280 × 720, live: click Day Desk and Night Desk, Off and On · ${SLIDE_SLOTS[chosen.slide]}</span>${readyWindow({ header: { settings: true }, overlay: appSettings() })}</div>
</div>`]);
