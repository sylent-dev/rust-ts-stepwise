// Section: the manual in a window too small for the other screens, to decide at step 13d: the same
// message as theirs, or the manual down to 800 pixels wide. It is shown as it was drawn for 1280: the
// maps of its examples cover their code, so staying would need a narrow layout that nothing draws yet.
SECTIONS.push(["To decide · The manual in a small window", () => `<div class="page-row">
  <div class="page-slot"><span>${chosen.manualsmall === "message"
    ? "5 · 1024 × 640, live: the manual gives way to the message, as the other screens; drag the bottom right corner"
    : "6 · 1024 × 640, live: the manual stays as it was drawn for 1280, and asks for a computer under 800 wide; the maps of the examples cover their code, so it would need a narrow layout of its own; drag the bottom right corner"}</span>${messageLiveWindow("manual")}</div>
</div>`]);
