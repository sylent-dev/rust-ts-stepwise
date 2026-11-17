// Section: the menus of the header, live, with their keyboard, decided at step 13b: the menu bar of a
// code editor. The window is the level screen; its four menus open with the mouse and with the keys.
// One row is lit at a time, under the pointer or chosen with the keys, and the greyed rows are
// skipped. The opening and the closing of a menu follow two controls of the page, an open decision of
// step 13b: the design system says at once.

// The speed in use, kept while the page stays open.
let menuLiveSpeed = 2;

// A menu whose rows take the focus. `kind` is "menu" or "speeds".
const menuLiveDropdown = (rows, left, top, kind) => `<div class="app-popup app-dropdown" data-menu-live-${kind} tabindex="-1" style="left:${left}px;top:${top}px">${rows.map(row => row
  ? `<div class="app-menu-row ${row[2] ? "is-off" : ""}" tabindex="-1" ${row[1] === "›" ? "data-submenu" : ""}><span>${row[0]}</span>${appMenuEnd(row[1])}</div>`
  : '<div class="app-menu-line"></div>').join("")}</div>`;

const menuLiveRoot = node => node?.closest?.("[data-menu-live]");
const menuLiveRows = menu => [...menu.querySelectorAll(".app-menu-row:not(.is-off)")];
const menuLiveFocus = element => element?.focus({ preventScroll: true });

function menuLiveCloseSpeeds(root) {
  root.querySelector("[data-menu-live-speeds]")?.remove();
  root.querySelector(".app-menu-row.is-open")?.classList.remove("is-open");
}

// Closes the menu. `atOnce` when another menu takes its place; otherwise as the control of the page
// says, and at once for a learner who asked for less motion, for whom no animation plays.
function menuLiveClose(root, atOnce = false) {
  menuLiveCloseSpeeds(root);
  root.querySelector(".app-menu.is-open")?.classList.remove("is-open");
  const menu = root.querySelector("[data-menu-live-menu]");
  if (!menu) return;
  menu.removeAttribute("data-menu-live-menu");
  menu.classList.remove("is-opening");
  menu.classList.add("is-closing");
  if (atOnce || chosen.menuClose === "none" || getComputedStyle(menu).animationName === "none") menu.remove();
  else menu.addEventListener("animationend", () => menu.remove(), { once: true });
}

// Opens the menu of `button`, under it. `focus` is the row that takes the focus: "first", "last" or
// none, when the mouse opens it.
function menuLiveOpen(button, focus) {
  const root = menuLiveRoot(button);
  // A menu that takes the place of its neighbor is there at once: only the first one opens.
  const first = !root.querySelector("[data-menu-live-menu]");
  menuLiveClose(root, true);
  button.classList.add("is-open");
  root.querySelector(".app-window").insertAdjacentHTML("beforeend", menuLiveDropdown(appMenuRows(button.textContent), button.offsetLeft, 49, "menu"));
  const menu = root.querySelector("[data-menu-live-menu]");
  menu.classList.toggle("is-opening", first);
  if (focus) menuLiveFocus(menuLiveRows(menu).at(focus === "last" ? -1 : 0));
  else menuLiveFocus(button);
}

// Opens the speeds beside the row Speed, the first one on the line of that row.
function menuLiveOpenSpeeds(row, focus) {
  const root = menuLiveRoot(row);
  const menu = row.parentElement;
  if (!root.querySelector("[data-menu-live-speeds]")) {
    row.classList.add("is-open");
    const rows = SPEEDS.map((speed, index) => [speed, index === menuLiveSpeed ? "✓" : ""]);
    root.querySelector(".app-window").insertAdjacentHTML("beforeend", menuLiveDropdown(rows, menu.offsetLeft + menu.offsetWidth, menu.offsetTop + row.offsetTop - 4, "speeds"));
    root.querySelector("[data-menu-live-speeds]").classList.add("is-opening");
  }
  if (focus) menuLiveFocus(menuLiveRows(root.querySelector("[data-menu-live-speeds]"))[menuLiveSpeed]);
}

// Runs a row: the mock-up only names it above the window, then closes the menu.
function menuLiveRun(row) {
  const root = menuLiveRoot(row);
  const button = root.querySelector(".app-menu.is-open");
  const speeds = row.parentElement.matches("[data-menu-live-speeds]");
  if (speeds) menuLiveSpeed = menuLiveRows(row.parentElement).indexOf(row);
  root.querySelector("[data-menu-live-last]").textContent = [button.textContent, ...(speeds ? ["Speed"] : []), row.firstElementChild.textContent].join(" › ");
  menuLiveClose(root);
  menuLiveFocus(button);
}

// The menu beside `button`, the last one before the first.
function menuLiveBeside(button, step) {
  const names = [...button.parentElement.children];
  return names[(names.indexOf(button) + step + names.length) % names.length];
}

// The level screen with its menus live. The bar is one stop of Tab: only the menu left last takes it.
function menuLiveWindow() {
  const template = document.createElement("template");
  template.innerHTML = readyWindow();
  template.content.querySelectorAll(".app-menu").forEach((button, index) => { button.tabIndex = index ? -1 : 0; });
  return template.innerHTML;
}

SECTIONS.push(["The menus, live: their keyboard and their opening", () => `
  <p class="menu-keys-intro"><b>To decide: the opening of a menu.</b> The design system says <i>at once</i> (<b>13</b>) since step 12d, where a menu fading in over 100 ms was compared and rejected: as in a code editor, nothing waits between a key and its answer. <b>14</b> grows from the corner under its name, <b>15</b> unrolls from the bar, <b>16</b> slides down, <b>17</b> pops past its size and comes back, as the robot. The slider sets how long it takes, and <b>19</b> plays it backwards when the menu closes. In every one, a menu that takes the place of its neighbor is there at once, the rows answer while it opens, and nothing moves for a learner who asked for less motion.</p>
  <p class="menu-keys-intro">Live: the four menus open with the mouse and with the keys, as the menu bar of a code editor. Click the name <b>stepwise</b> in the window, then press <b>Tab</b>: it stops once on the bar, on the menu left last. <b>←</b> <b>→</b> go from a menu to the next, <b>Enter</b>, <b>Space</b> or <b>↓</b> opens it on its first row, <b>↑</b> on its last. In a menu, <b>↑</b> <b>↓</b>, <b>Home</b> and <b>End</b> choose a row and <b>Enter</b> or <b>Space</b> runs it; <b>←</b> <b>→</b> open the menu beside, except <b>→</b> on <b>Speed</b>, which opens its speeds, and <b>←</b>, which leaves them; <b>Esc</b> closes the menu and gives the focus back to its name; <b>Tab</b> closes it and goes on. With the mouse, a click opens a menu and, once one is open, pointing at another name opens it.</p>
  <div class="page-row"><div class="page-slot menu-live" data-menu-live>
    <span>1280 × 720, the level screen. Last command run: <b data-menu-live-last>none yet</b></span>
    ${menuLiveWindow()}
  </div></div>`]);

document.addEventListener("focusin", event => {
  const root = menuLiveRoot(event.target);
  if (!root || !event.target.matches(".app-menu")) return;
  for (const button of event.target.parentElement.children) button.tabIndex = button === event.target ? 0 : -1;
});

document.addEventListener("keydown", event => {
  const root = menuLiveRoot(event.target);
  if (!root || event.ctrlKey || event.altKey || event.metaKey) return;
  const { target, key } = event;
  const beside = { ArrowLeft: -1, ArrowRight: 1 }[key];
  const open = root.querySelector(".app-menu.is-open");
  const menu = target.closest(".app-dropdown");
  let handled = true;
  if (target.matches(".app-menu")) {
    if (["Enter", " ", "ArrowDown"].includes(key)) menuLiveOpen(target, "first");
    else if (key === "ArrowUp") menuLiveOpen(target, "last");
    else if (key === "Escape" && open) menuLiveClose(root);
    else if (beside && open) menuLiveOpen(menuLiveBeside(target, beside), "first");
    else if (beside) menuLiveFocus(menuLiveBeside(target, beside));
    else handled = false;
  } else if (menu && open) {
    const speeds = menu.matches("[data-menu-live-speeds]");
    const rows = menuLiveRows(menu);
    // -1 when the menu itself holds the focus: the pointer has left its rows.
    const at = rows.indexOf(target);
    if (key === "ArrowDown") menuLiveFocus(rows[(at + 1) % rows.length]);
    else if (key === "ArrowUp") menuLiveFocus(rows.at(at <= 0 ? -1 : at - 1));
    else if (key === "Home") menuLiveFocus(rows[0]);
    else if (key === "End") menuLiveFocus(rows.at(-1));
    else if (speeds && (key === "Escape" || key === "ArrowLeft")) {
      const row = root.querySelector(".app-menu-row.is-open");
      menuLiveCloseSpeeds(root);
      menuLiveFocus(row);
    } else if (key === "Escape") {
      menuLiveClose(root);
      menuLiveFocus(open);
    } else if (at >= 0 && target.matches("[data-submenu]") && ["Enter", " ", "ArrowRight"].includes(key)) menuLiveOpenSpeeds(target, true);
    else if (at >= 0 && ["Enter", " "].includes(key)) menuLiveRun(target);
    else if (beside) menuLiveOpen(menuLiveBeside(open, beside), "first");
    else if (key === "Tab") {
      // The focus goes back to the name of the menu, and the browser moves it on from there.
      menuLiveClose(root);
      menuLiveFocus(open);
      handled = false;
    } else handled = false;
  } else handled = false;
  if (handled) event.preventDefault();
});

document.addEventListener("click", event => {
  const root = document.querySelector("[data-menu-live]");
  if (!root) return;
  const button = event.target.closest("[data-menu-live] .app-menu");
  const row = event.target.closest("[data-menu-live] .app-dropdown .app-menu-row:not(.is-off)");
  if (button) {
    if (button.classList.contains("is-open")) menuLiveClose(root);
    else menuLiveOpen(button);
  } else if (row?.matches("[data-submenu]")) menuLiveOpenSpeeds(row);
  else if (row) menuLiveRun(row);
  else if (!event.target.closest("[data-menu-live] .app-dropdown")) menuLiveClose(root);
});

// The pointer lights the row it is on, as the keys do: the row takes the focus.
document.addEventListener("mouseover", event => {
  const root = menuLiveRoot(event.target);
  const open = root?.querySelector(".app-menu.is-open");
  if (!open) return;
  const button = event.target.closest(".app-menu");
  const row = event.target.closest(".app-dropdown .app-menu-row");
  if (button && button !== open) menuLiveOpen(button);
  if (!row) return;
  if (row.parentElement.matches("[data-menu-live-menu]") && !row.matches("[data-submenu]")) menuLiveCloseSpeeds(root);
  if (row.matches(".is-off")) menuLiveFocus(row.parentElement);
  else menuLiveFocus(row);
  if (row.matches("[data-submenu]")) menuLiveOpenSpeeds(row);
});

// Once the pointer leaves a menu, none of its rows stays lit.
document.addEventListener("mouseout", event => {
  const menu = event.target.closest?.("[data-menu-live] .app-dropdown");
  if (menu?.contains(document.activeElement) && !event.relatedTarget?.closest?.(".app-dropdown")) menuLiveFocus(menu);
});
