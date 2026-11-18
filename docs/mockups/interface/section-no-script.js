// Section: JavaScript turned off, to decide at step 13d. The application can't start, and the page
// itself answers: with the message of a browser too old, which tells to update a browser that may be
// the latest, or with a message of its own.
SECTIONS.push(["To decide · JavaScript turned off", () => `<div class="page-row">
  <div class="page-slot"><span>${chosen.noscript === "own"
    ? "2 · 1280 × 720, JavaScript turned off: a message of its own, which says what to turn on"
    : "1 · 1280 × 720, JavaScript turned off: the message of a browser too old, as it is"}</span>${messageWindow(chosen.noscript === "own" ? "script" : "old", [1280, 720])}</div>
</div>`]);
