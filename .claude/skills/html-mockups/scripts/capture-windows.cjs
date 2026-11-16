// Captures every window of a mock-up page, one PNG per window, named by its section and its place
// in it, to compare the page before and after a change with compare-captures.py.
//
//   node capture-windows.cjs <url> <output folder> [window selector] [section selector]
//
// The selectors are those of the template: `.app-window` in `.page-section`, whose title is its h2.
// Each window is captured pinned to the corner of the screen, on whole pixels and in front of a plain
// backdrop: what is above it on the page, or behind a board without background, never changes its
// pixels. The animations are frozen. Prints the errors of the browser console and fails on them.
//
// Playwright is installed once, outside the projects (see screenshot.cjs); PLAYWRIGHT_HOME points to
// another installation folder.
const fs = require("node:fs");
const path = require("node:path");

const home = process.env.PLAYWRIGHT_HOME || path.join(process.env.HOME, ".local/share/mockup-tools");
const { chromium } = require(path.join(home, "node_modules/playwright"));

async function main() {
  const [url, folder, windowSelector = ".app-window", sectionSelector = ".page-section"] = process.argv.slice(2);
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  let count = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: "reduce" });
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }" });
    await page.evaluate(() => {
      const backdrop = document.createElement("div");
      backdrop.style.cssText = "position:fixed;inset:0;z-index:99998;background:#2a2d31";
      document.body.append(backdrop);
    });
    const sections = await page.$$(sectionSelector);
    for (const section of sections) {
      const heading = await section.$eval("h2", element => element.textContent);
      const title = heading.replace(/^[0-9]+[.] */, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const windows = await section.$$(windowSelector);
      for (let place = 0; place < windows.length; place++) {
        const element = windows[place];
        await element.evaluate(node => {
          node.dataset.styleBefore = node.style.cssText;
          node.style.cssText += ";position:fixed;left:0;top:0;z-index:99999;margin:0";
        });
        await element.screenshot({ path: path.join(folder, `${title}--${String(place + 1).padStart(2, "0")}.png`) });
        await element.evaluate(node => {
          node.style.cssText = node.dataset.styleBefore;
          delete node.dataset.styleBefore;
        });
        count += 1;
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`${count} windows, ${errors.length} errors`);
  for (const error of errors) console.error(`  ${error}`);
  if (errors.length > 0) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
