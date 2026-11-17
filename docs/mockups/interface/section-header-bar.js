// Section: a decision of step 13b. The content of a header is centered on the height above its last
// 3 pixels, those of the bar of the progress. A header that draws no bar leaves them empty: the
// sandbox, and every screen until the bar arrives with the list of the levels (step 21). The fill of
// a menu under the pointer then stands 8 pixels under the top of the header and 11 above its bottom.
// Each variant is a class of the header and the top of the menus under it.
const HEADER_BAR = {
  empty: ["10 · As it is", "", 49, "8 px above the fill, 11 px under it: the 3 pixels of the bar stay empty"],
  centered: ["11 · Centered on its whole height", "is-centered", 49, "9.5 px above and under: the names stand 1.5 px lower than on a level"],
  short: ["12 · 3 pixels shorter", "is-short", 46, "8 px above and under: the header is 46 px high, and the screen starts 3 px higher than on a level"],
};

// The same window, its header taking the class of a variant.
const withHeaderClass = (html, name) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  if (name) template.content.querySelector(".app-header").classList.add(name);
  return template.innerHTML;
};

// The left of a header, four times larger: the menus, the first one lit.
const headerZoom = (title, note, header) => `<div>
    <span class="controls-board-title">${title}</span>
    <div class="header-zoom"><div class="app-window">${header}<div class="app-block"></div></div></div>
    <span class="header-zoom-note">${note}</span>
  </div>`;

SECTIONS.push(["The header without the bar of the progress", () => {
  const [title, name, top] = HEADER_BAR[chosen.headerBar];
  return `
  <p class="header-bar-intro">The content of a header is centered above its last 3 pixels, where the bar of the progress runs. Without the bar, those 3 pixels stay empty, and the fill of a menu under the pointer no longer looks centered: 8 pixels above it, 11 under it. It is the case of the sandbox, which has no bar, and of every screen of the application until the bar arrives with the list of the levels (step 21). <b>10</b> leaves it. <b>11</b> centers the content on the whole height: the names then stand 1.5 pixel lower than on a level. <b>12</b> takes the 3 pixels away with the bar: the names stay where they are on a level, and the screen starts 3 pixels higher.</p>
  <div class="page-row">
    <div class="page-slot"><span>${title}: 1280 × 720, the sandbox, its menu Level open</span>${withHeaderClass(sandboxWindow({ robot: "3,3", facing: "east", state: "Ready", steps: 0, console: '<span class="app-weak">Run your program to see what it prints.</span>', header: { menu: "Level" }, overlay: appDropdown(MENU_LEFT.Level, SANDBOX_LEVEL_ROWS, undefined, top) }), name)}</div>
  </div>
  <h3>The menus four times larger: a level, then the three</h3>
  <div class="header-zooms">
    ${headerZoom("A level, with its bar", "8 px above the fill, 8 px down to the bar", appHeader({ menu: "Level" }))}
    ${Object.values(HEADER_BAR).map(([name, className, , note]) => headerZoom(name, note, withHeaderClass(appHeader({ menu: "Level", sandbox: true }), className))).join("")}
  </div>`;
}]);
