// The tabs of the page and its sections. The address keeps the choices (?vision=…).

// One group of tabs per open decision; `fallback` is the choice shown by default.
// A group with a `range` instead of `options` is a slider, for a value tuned by eye.
const VARIANTS = {
  theme: { label: "Style", options: Object.fromEntries(Object.entries(THEMES).map(([key, theme]) => [key, theme.title])), fallback: Object.keys(THEMES)[0] },
  vision: { label: "Vision", options: { normal: "Normal", protanopia: "Protanopia", deuteranopia: "Deuteranopia", tritanopia: "Tritanopia" }, fallback: "normal" },
  // Step 11a, the animations (section-motion-carry.js): how far the robot steps back to pick up or drop.
  backOff: { label: "Step back (% of a cell)", range: { min: 10, max: 45, step: 1 }, fallback: "34" },
  // Step 11a, the animations (section-motion-bump.js): the bump into a wall.
  bump: { label: "Bump", options: { back: "26. Back", shake: "27. Back and shake", squash: "28. Squash", spark: "29. Spark" }, fallback: "shake" },
};

const params = new URLSearchParams(location.search);
const accepts = (variant, value) => variant.range
  ? value !== null && Number(value) >= variant.range.min && Number(value) <= variant.range.max
  : value in variant.options;
const chosen = Object.fromEntries(Object.entries(VARIANTS).map(([key, variant]) =>
  [key, accepts(variant, params.get(key)) ? params.get(key) : variant.fallback]));

// Each section script adds itself: [title, function returning its HTML]. The newest goes first.
const SECTIONS = [];
// What runs once the sheet is drawn again, such as the players of the animations (motion.js).
const AFTER_RENDER = [];

function renderTabs() {
  // A group with a single option is decided: it isn't shown.
  document.getElementById("tabs").innerHTML = Object.entries(VARIANTS)
    .filter(([, variant]) => variant.range || Object.keys(variant.options).length > 1)
    .map(([key, variant]) => `<div class="group"><span>${variant.label}</span>${variant.range
      ? `<input type="range" data-variant="${key}" min="${variant.range.min}" max="${variant.range.max}" step="${variant.range.step}" value="${chosen[key]}"><output>${chosen[key]}</output>`
      : Object.entries(variant.options).map(([value, label]) =>
        `<button type="button" data-variant="${key}" data-value="${value}" aria-pressed="${chosen[key] === value}">${label}</button>`).join("")}</div>`).join("");
}

function renderSheet() {
  for (const key of Object.keys(VARIANTS)) document.documentElement.dataset[key] = chosen[key];
  const theme = THEMES[chosen.theme];
  document.getElementById("sheet").innerHTML = `
    <header class="page-header"><h1>World elements · ${theme.title}</h1><p>${theme.text}</p></header>
    ${SECTIONS.length > 10 ? `<nav class="page-contents" aria-label="Sections">${SECTIONS.map(([title], index) =>
      `<a href="#section-${index + 1}">${index + 1}. ${title}</a>`).join("")}</nav>` : ""}
    ${SECTIONS.map(([title, content], index) => `<section class="page-section" id="section-${index + 1}"><h2>${index + 1}. ${title}</h2>${content()}</section>`).join("")}`;
  AFTER_RENDER.forEach(hook => hook());
}

function render() {
  renderTabs();
  renderSheet();
}

const keepInAddress = () => history.replaceState(null, "", "?" + new URLSearchParams(chosen) + location.hash);

document.getElementById("tabs").addEventListener("click", event => {
  const { variant, value } = event.target.dataset;
  if (!variant || value === undefined) return;
  chosen[variant] = value;
  keepInAddress();
  render();
});
// A slider redraws only the sheet while it moves, so that it keeps the pointer.
document.getElementById("tabs").addEventListener("input", event => {
  const { variant } = event.target.dataset;
  if (!variant) return;
  chosen[variant] = event.target.value;
  event.target.nextElementSibling.value = event.target.value;
  keepInAddress();
  renderSheet();
});
document.getElementById("file-warning").hidden = location.protocol !== "file:";
