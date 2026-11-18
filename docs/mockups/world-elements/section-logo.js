// Section: the logo, the smiling head of the robot, at several sizes.

// The logo, and the same head drawn for the tab of a browser.
const logoFile = () => element("logo");
const logoSmallFile = () => element("logo-small");

const LOGO_GROUNDS = [["On a light page", "#f4f6f8", "#222935"], ["On a dark page", "#1b1d20", "#e9ecef"]];

SECTIONS.push(["Logo", () => `
  <p>The head of the robot with happy eyes and a smile, alone: simple, and no taller than itself, so that the name stays on the line of the text beside it (decided in step 3a). Shown 96, 48, 32 and 16 px high.</p>
  <p>The icon of a browser tab is the same head drawn a second time, for 16 pixels, where the lines of the logo are under one pixel wide: thicker lines, in a square, with as much room above the head as under it (1 pixel each at 16 pixels), so that it sits on the middle of the title of the tab (decided at step 13d). Shown last, 32 and 16 px high.</p>
  <div class="page-row">${LOGO_GROUNDS.map(([title, ground]) => `
    <div class="page-slot"><span>${title}</span>
      <div style="background:${ground};padding:20px;border-radius:8px">
        <div class="page-row" style="gap:16px;align-items:flex-end">${[96, 48, 32, 16].map(size => `<img src="${logoFile()}" height="${size}" alt="">`).join("")}${[32, 16].map(size => `<img src="${logoSmallFile()}" height="${size}" alt="" style="margin-left:${size === 32 ? 24 : 0}px">`).join("")}</div>
      </div></div>`).join("")}
  </div>`]);
