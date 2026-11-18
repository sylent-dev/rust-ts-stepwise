// Section: the messages. The banner of the storage refused (× hides it), then what replaces the screen.
SECTIONS.push(["Messages", () => `
  <h3>Storage refused</h3>
  <div class="page-row">
    <div class="page-slot"><span>1280 × 720, the home screen: the banner under the header, × hides it until the next visit</span>${homeWindow({ banner: appStorageBanner() })}</div>
    <div class="page-slot"><span>1280 × 720, the level screen: the map keeps its size, the editor and the console give their height</span>${readyWindow({ banner: appStorageBanner() })}</div>
  </div>
  <h3>In place of the screen</h3>
  <div class="page-row">
    <div class="page-slot"><span>1024 × 640, live, on every screen, the manual too, a window that can still grow on its screen: drag the bottom right corner. The size follows; under 800 wide it asks for a computer; from 1280 × 720 the screen comes back</span>${messageLiveWindow()}</div>
    <div class="page-slot"><span>1366 × 650, a laptop of 1366 × 768 whose window already fills its screen: the message only says what can work there, the zoom and the full screen (the zoom alone on a Mac or a Chromebook, which have no F11, and in full screen)</span>${messageWindow("small", [1366, 650], MESSAGE_FIX_FILLED)}</div>
    <div class="page-slot"><span>390 × 844, a phone</span>${messageWindow("phone", [390, 844])}</div>
    <div class="page-slot"><span>1280 × 720, a browser too old: written in the page itself, shown even without JavaScript</span>${messageWindow("old", [1280, 720])}</div>
    <div class="page-slot"><span>1280 × 720, the files can't load (offline): Try again reloads the page</span>${messageWindow("offline", [1280, 720])}</div>
    <div class="page-slot"><span>1280 × 720, JavaScript turned off: written in the page itself, a message of its own rather than the one of a browser too old, which may be the latest; JS behind it, hardly there</span>${messageWindow("script", [1280, 720])}</div>
    <div class="page-slot"><span>1280 × 720, an address that doesn't exist (mistyped, a level after the last): All levels leads to the home screen; 404 behind it, hardly there</span>${messageWindow("missing", [1280, 720])}</div>
  </div>`]);
