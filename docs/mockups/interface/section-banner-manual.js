// Section: the banner of the storage refused on the manual, an open decision of step 13c. The manual
// has no header to put it under, and nothing is saved from it. The control *Banner on the manual*, at
// the top of the page, compares: no banner, one across the whole top, one above the content. The window
// is live: × hides the banner. The section and its control go once decided.
const BANNER_MANUAL_SLOTS = {
  none: "1 · no banner: nothing is saved from the manual, and the level beside it has shown it",
  top: "2 · across the whole width, at the top: the name and the column go down by its height",
  content: "3 · above the content: the column keeps its height, the name its place",
};

SECTIONS.push(["Storage refused: the banner on the manual", () => `<div class="page-row">
  <div class="page-slot"><span>1280 × 720, the manual in its own tab, opened from a level · ${BANNER_MANUAL_SLOTS[chosen.manualBanner]}</span>${manualWindow({ banner: chosen.manualBanner })}</div>
  <div class="page-slot"><span>1280 × 720, the level it was opened from, in the other tab: the banner under the header, as already decided</span>${readyWindow({ banner: appStorageBanner() })}</div>
</div>`]);
