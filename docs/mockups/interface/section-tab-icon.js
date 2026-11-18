// Section: the icon of the tab of the browser, to decide at step 13d. The logo is 55 × 47 with lines of
// 3: at 16 pixels, they are under one pixel wide. Each proposal is shown in a tab of a light and of a
// dark browser, at 16 pixels then at 32 (a screen of high density, a bookmark), and with the pixels of
// both enlarged. The one chosen is also the icon of this page, in the real tab of the browser.
const TAB_ICONS = {
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4.5 9.5 55 47" width="55" height="47">
<rect x="6" y="11" width="52" height="44" rx="14" fill="#fff" stroke="#222935" stroke-width="3"/>
<rect x="13" y="20" width="38" height="17" rx="8.5" fill="#222935"/><path d="M19.5 30.5 Q24 24 28.5 30.5" fill="none" stroke="#3fc3ff" stroke-width="3.2" stroke-linecap="round"/><path d="M35.5 30.5 Q40 24 44.5 30.5" fill="none" stroke="#3fc3ff" stroke-width="3.2" stroke-linecap="round"/><path d="M23 43 Q32 50 41 43" fill="none" stroke="#222935" stroke-width="3" stroke-linecap="round"/>
</svg>`,
  bold: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
<rect x="2" y="4" width="28" height="24" rx="8" fill="#fff" stroke="#222935" stroke-width="4"/>
<rect x="6" y="9" width="20" height="10" rx="5" fill="#222935"/><path d="M9.4 15.6 Q11.4 11.8 13.4 15.6" fill="none" stroke="#3fc3ff" stroke-width="2.4" stroke-linecap="round"/><path d="M18.6 15.6 Q20.6 11.8 22.6 15.6" fill="none" stroke="#3fc3ff" stroke-width="2.4" stroke-linecap="round"/><path d="M12 22.4 Q16 25.4 20 22.4" fill="none" stroke="#222935" stroke-width="2.4" stroke-linecap="round"/>
</svg>`,
  square: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
<rect x="2" y="2" width="28" height="28" rx="9" fill="#fff" stroke="#222935" stroke-width="4"/>
<rect x="6" y="8" width="20" height="11" rx="5.5" fill="#222935"/><path d="M9.4 15.4 Q11.4 11 13.4 15.4" fill="none" stroke="#3fc3ff" stroke-width="2.4" stroke-linecap="round"/><path d="M18.6 15.4 Q20.6 11 22.6 15.4" fill="none" stroke="#3fc3ff" stroke-width="2.4" stroke-linecap="round"/><path d="M11.5 23 Q16 26.6 20.5 23" fill="none" stroke="#222935" stroke-width="2.6" stroke-linecap="round"/>
</svg>`,
};
const TAB_ICON_NAMES = { logo: "7 · The logo, as it is", bold: "8 · Thicker lines, the same head", square: "9 · A squarer head, which fills the icon" };
const TAB_STRIP_TONES = { light: "#ffffff", dark: "#35363a" };

const tabIconAddress = key => `data:image/svg+xml,${encodeURIComponent(TAB_ICONS[key])}`;
const tabIconImage = (key, size) => `<img class="tab-strip-icon" src="${tabIconAddress(key)}" width="${size}" height="${size}" alt="">`;
const tabStrip = (key, tone) => `<div class="tab-strip is-${tone}">
  <div class="tab-strip-tab is-here">${tabIconImage(key, 16)}<span>18. Paint a square · Stepwise</span>${ICONS.close(10)}</div>
  <div class="tab-strip-tab">${tabIconImage(key, 16)}<span>Manual · Stepwise</span>${ICONS.close(10)}</div>
  <div class="tab-strip-tab"><i></i><span>Another website</span>${ICONS.close(10)}</div>
</div>`;
// The pixels of the icon at `size`, enlarged: what the browser has to draw it with.
const tabIconPixels = (key, tone, size) => `<canvas class="tab-icon-pixels" data-icon="${key}" data-tone="${tone}" width="${size}" height="${size}" title="${size} × ${size} pixels, enlarged"></canvas>`;
const tabIconRow = key => `<div class="tab-icon-row ${chosen.tabicon === key ? "is-chosen" : ""}">
  <b>${TAB_ICON_NAMES[key]}</b>
  <div class="tab-icon-tones">${Object.keys(TAB_STRIP_TONES).map(tone => `<div class="tab-icon-tone">${tabStrip(key, tone)}<div class="tab-icon-sizes is-${tone}">${tabIconImage(key, 16)}${tabIconImage(key, 32)}${tabIconPixels(key, tone, 16)}${tabIconPixels(key, tone, 32)}</div></div>`).join("")}</div>
</div>`;

SECTIONS.push(["To decide · The icon of the tab", () => `<p class="tab-icon-note">The one chosen above is the icon of this page: look at its tab in the browser.</p>${Object.keys(TAB_ICONS).map(tabIconRow).join("")}`]);

// The icon keeps its proportions in its square, as in a tab.
function tabIconDraw(canvas) {
  canvas.dataset.drawn = "";
  const image = new Image();
  image.onload = () => {
    const size = canvas.width;
    const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
    const [width, height] = [image.naturalWidth * scale, image.naturalHeight * scale];
    const context = canvas.getContext("2d");
    context.fillStyle = TAB_STRIP_TONES[canvas.dataset.tone];
    context.fillRect(0, 0, size, size);
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  };
  image.src = tabIconAddress(canvas.dataset.icon);
}
function tabIconShow() {
  document.querySelectorAll(".tab-icon-pixels:not([data-drawn])").forEach(tabIconDraw);
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; link.type = "image/svg+xml"; document.head.append(link); }
  if (link.dataset.icon !== chosen.tabicon) { link.dataset.icon = chosen.tabicon; link.href = tabIconAddress(chosen.tabicon); }
}
new MutationObserver(tabIconShow).observe(document.getElementById("sheet"), { childList: true });
