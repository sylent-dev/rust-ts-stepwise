// Section: an address that doesn't exist (a mistyped one, a level after the last), to decide at step
// 13d: a message in place of the screen, as the others, with the way back; or the home screen, opened
// in its place without a word.
SECTIONS.push(["To decide · An address that doesn’t exist", () => `<div class="page-row">
  <div class="page-slot"><span>${chosen.missing === "message"
    ? "3 · 1280 × 720, stepwise.sylent.tools/levels/99: a message, and All levels leads to the home screen"
    : "4 · 1280 × 720, stepwise.sylent.tools/levels/99: the home screen opens in its place, the address corrected"}</span>${chosen.missing === "message" ? messageWindow("missing", [1280, 720]) : homeWindow()}</div>
</div>`]);
