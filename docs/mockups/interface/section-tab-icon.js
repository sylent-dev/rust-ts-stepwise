// Section: the icon of the tab of the browser, decided at step 13d: the head of the logo drawn a second
// time for 16 pixels, where the lines of the logo are under one pixel wide: the file of the
// application, web/static/favicon.svg. Thicker lines, in a square, with as much room above the head as under it (1 pixel each
// at 16 pixels), so that it sits on the middle of the title of the tab. It is shown in a tab of a light
// and of a dark browser, then alone at 16 pixels and at 32 (a screen of high density, a bookmark), then
// with the pixels of both enlarged. It is also the icon of this page.
const TAB_ICON = "../../web/static/favicon.svg";
const TAB_STRIP_TONES = { light: "#ffffff", dark: "#35363a" };

const tabIconImage = size => `<img class="tab-strip-icon" src="${TAB_ICON}" width="${size}" height="${size}" alt="">`;
const tabStrip = tone => `<div class="tab-strip is-${tone}">
  <div class="tab-strip-tab is-here">${tabIconImage(16)}<span>18. Paint a square · Stepwise</span>${ICONS.close(10)}</div>
  <div class="tab-strip-tab">${tabIconImage(16)}<span>Manual · Stepwise</span>${ICONS.close(10)}</div>
  <div class="tab-strip-tab"><i></i><span>Another website</span>${ICONS.close(10)}</div>
</div>`;
// The pixels of the icon at `size`, enlarged: what the browser has to draw it with.
const tabIconPixels = (tone, size) => `<canvas class="tab-icon-pixels" data-tone="${tone}" width="${size}" height="${size}" title="${size} × ${size} pixels, enlarged"></canvas>`;

SECTIONS.push(["The icon of the tab", () => `<div class="tab-icon-tones">${Object.keys(TAB_STRIP_TONES).map(tone =>
  `<div class="tab-icon-tone">${tabStrip(tone)}<div class="tab-icon-sizes is-${tone}">${tabIconImage(16)}${tabIconImage(32)}${tabIconPixels(tone, 16)}${tabIconPixels(tone, 32)}</div></div>`).join("")}</div>`]);

function tabIconDraw(canvas) {
  canvas.dataset.drawn = "";
  const image = new Image();
  image.onload = () => {
    const context = canvas.getContext("2d");
    context.fillStyle = TAB_STRIP_TONES[canvas.dataset.tone];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = TAB_ICON;
}
new MutationObserver(() => document.querySelectorAll(".tab-icon-pixels:not([data-drawn])").forEach(tabIconDraw))
  .observe(document.getElementById("sheet"), { childList: true });
