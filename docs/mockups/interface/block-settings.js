// The panel of the settings, over a veil, from the gear of the level screen or the link of the home
// screen. A change applies at once and is saved: no Save button. Escape, × or a click on the veil closes it.
// A click on a theme changes the whole page, as it would change the whole application.

const SETTINGS_THEMES = { "day-desk": "Day Desk", "night-desk": "Night Desk" };

// Two segments side by side, the one chosen dark (or light at night). `data` marks what they set. The
// fill of the one chosen is an element of its own, placed under it once the page is drawn.
const settingsSegments = (options, current, data) => `<div class="settings-segments" ${data}><i class="settings-thumb" aria-hidden="true"></i>${Object.entries(options).map(([key, label]) =>
  `<button type="button" data-value="${key}" aria-pressed="${key === current}">${label}</button>`).join("")}</div>`;

// Places the fill of a group under its segment chosen, at once.
function settingsPlaceFill(group) {
  const pressed = group.querySelector('button[aria-pressed="true"]');
  const fill = group.querySelector(".settings-thumb");
  fill.style.transform = `translateX(${pressed.offsetLeft}px)`;
  fill.style.width = `${pressed.offsetWidth}px`;
}

// Where the fill of a group stands now, even in the middle of a slide, and the segment it left.
function settingsFillNow(group) {
  const fill = group.querySelector(".settings-thumb").getBoundingClientRect();
  return { left: fill.left - group.getBoundingClientRect().left, width: fill.width, value: group.querySelector('button[aria-pressed="true"]').dataset.value };
}

// Slides the fill of a group from where it stood to its segment chosen: it starts fast and slows down
// at its end, and the two texts turn with it. Nothing moves for a learner who asked for less motion.
// The duration and the curve are those of the page (`--settings-slide-duration`, `--settings-slide-ease`).
function settingsSlide(group, from) {
  settingsPlaceFill(group);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const page = getComputedStyle(document.documentElement);
  const timing = { duration: parseFloat(page.getPropertyValue("--settings-slide-duration")), easing: page.getPropertyValue("--settings-slide-ease").trim() };
  const fill = group.querySelector(".settings-thumb");
  const pressed = group.querySelector('button[aria-pressed="true"]');
  const left = group.querySelector(`button[data-value="${from.value}"]`);
  fill.animate([{ transform: `translateX(${from.left}px)`, width: `${from.width}px` }, { transform: fill.style.transform, width: fill.style.width }], timing);
  if (!left || left === pressed) return;
  const chosenColor = getComputedStyle(pressed).color, restColor = getComputedStyle(left).color;
  pressed.animate([{ color: restColor }, { color: chosenColor }], timing);
  left.animate([{ color: chosenColor }, { color: restColor }], timing);
}

// A theme clicked draws the whole page again: the slide it starts waits for the new page.
let settingsSlideFrom = null;
new MutationObserver(() => {
  const from = settingsSlideFrom;
  settingsSlideFrom = null;
  document.querySelectorAll(".settings-segments").forEach(group => from && "settingsTheme" in group.dataset ? settingsSlide(group, from) : settingsPlaceFill(group));
}).observe(document.getElementById("sheet"), { childList: true });

// Clear all progress: alone, gray at rest, since it says what it does and shouldn't call for a click. It
// turns red from the left as a loading bar while the mouse rests on it (or while it has the focus of the
// keyboard), and a click only counts once it is full: a danger that a passing click can't set off. That
// click clears at once, without a confirmation, so its name has no ellipsis.
const SETTINGS_CLEAR = '<button type="button" class="settings-clear"><span>Clear all progress</span><span class="settings-clear-fill" aria-hidden="true">Clear all progress</span></button>';

// `sounds` is the state of the setting Sounds, off by default.
function appSettings({ sounds = false } = {}) {
  return `<div class="app-veil"><div class="app-popup app-settings">
    <div class="app-shortcuts-head"><b>Settings</b><button type="button" title="Close">${ICONS.close(16)}</button></div>
    <div class="settings-row"><div><b>Theme</b><p>Only the interface changes: the map keeps its look.</p></div>${settingsSegments(SETTINGS_THEMES, chosen.theme, "data-settings-theme")}</div>
    <div class="settings-row"><b>Sounds</b>${settingsSegments({ off: "Off", on: "On" }, sounds ? "on" : "off", "data-settings-sounds")}</div>
    <div class="settings-row is-end">${SETTINGS_CLEAR}</div>
  </div></div>`;
}

// A theme chosen changes the whole page; Sounds changes in its own window only. The fill slides to
// the segment clicked, in every window that shows the setting.
document.addEventListener("click", event => {
  const button = event.target.closest?.(".settings-segments button");
  if (!button || button.getAttribute("aria-pressed") === "true") return;
  const group = button.parentElement;
  const from = settingsFillNow(group);
  if ("settingsTheme" in group.dataset) {
    settingsSlideFrom = from;
    chosen.theme = button.dataset.value;
    keepInAddress();
    render();
  } else {
    group.querySelectorAll("button").forEach(other => other.setAttribute("aria-pressed", other === button));
    settingsSlide(group, from);
  }
});

// The button of Clear all progress is ready once its bar is full; it empties at once when the mouse leaves.
document.addEventListener("transitionend", event => {
  if (event.target.classList?.contains("settings-clear-fill") && event.target.matches(".settings-clear:hover > *, .settings-clear:focus-visible > *")) event.target.parentElement.classList.add("is-ready");
});
const settingsClearReset = event => event.target.closest?.(".settings-clear:not(.is-done)")?.classList.remove("is-ready");
document.addEventListener("mouseout", event => { if (!event.relatedTarget?.closest?.(".settings-clear")) settingsClearReset(event); });
document.addEventListener("focusout", settingsClearReset);
// A click before it is full does nothing; once full, the progress is cleared and the button says so.
document.addEventListener("click", event => {
  const button = event.target.closest?.(".settings-clear.is-ready:not(.is-done)");
  if (!button) return;
  button.classList.add("is-done");
  button.innerHTML = `<span>${ICONS.check(14)} Progress cleared</span>`;
});
