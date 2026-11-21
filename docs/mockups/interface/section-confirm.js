// Section: the confirmation of Restore starting code. It opens only from the menu Level, and says what is lost.
// The sandbox names itself where a level gives its number and its title.
// Clear all progress has none: its button must be held (block-settings.js).
SECTIONS.push(["Confirmation", () => `<div class="page-row">
  <div class="page-slot"><span>1280 × 720, Level › Restore starting code…</span>${readyWindow({ overlay: appConfirm({ question: "Restore the starting code of 18. Paint a square?", lost: "Your code will be replaced for good by the starting code of the level, as the first time.", action: "Restore starting code" }) })}</div>
  <div class="page-slot"><span>1280 × 720, the same in the sandbox</span>${sandboxWindow({ robot: "3,3", facing: "east", state: "Ready", steps: 0, console: '<span class="app-weak">Run your program to see what it prints.</span>', overlay: appConfirm({ question: "Restore the starting code of the sandbox?", lost: "Your code will be replaced for good by the starting code of the sandbox, as the first time.", action: "Restore starting code" }) })}</div>
</div>`]);
