// Section: a level still locked, opened by its address (step 21b). The levels open in order, and each
// must be earned: an address typed or shared opens no level that the learner hasn't unlocked. A
// message takes the place of the screen, as for an address that doesn't exist, with the sentence of
// a level locked on the home screen, which names the level to play (decided on 2026-11-28).
SECTIONS.push(["A level still locked, opened by its address", () => `
  <p class="motion-intro">The learner has done levels 1 and 2, and types the address of level 5, <code>/levels/5</code>. The message names the level to play, as the panel of a level locked on the home screen does; All levels leads to the home screen. The title of the tab says the same: <i>This level is locked · Stepwise</i>.</p>
  <div class="page-row">
    <div class="page-slot"><span>1280 × 720, a level still locked opened by its address</span>${messageWindow("locked", [1280, 720])}</div>
  </div>`]);
