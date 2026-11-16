---
name: html-mockups
description: Build the interactive HTML mock-up of a user interface from its approved wireframe, in docs/mockups/, comparing 3 or 4 styles with tabs, then iterate with the owner one decision at a time (one tab group per open decision) until the mock-up becomes the visual reference, and write the design tokens. Use it after the wireframes are approved, when the owner asks for a mock-up, a style, a visual design, or to compare variants of a screen before coding it.
---

# HTML mock-ups

Goal: choose the style with real content, every scenario and every state, before writing the interface. The mock-up answers one question at a time: the layout is already settled by the wireframe (`excalidraw-wireframes` skill), so the discussion is only about the look.

## 1. Build the page

Start from `assets/mockup-template.html` (read its comments), copied to `docs/mockups/<name>.html`:

- **One self-contained page**: the CSS and the JavaScript inline, only the fonts and the images of `assets/` outside.
- **Every frame of the wireframe becomes a window**, at its real size, with sample data close to real ones (long names, large numbers, the other language). Add every scenario and state in `SECTIONS`: empty, loading, waiting, each error, each kind of content. **A new section goes at the top** of `SECTIONS`, so that the owner finds it at once; past ten sections, the page shows a table of contents under its header, one link per section.
- **3 or 4 styles on the same page**, switched with the tabs at the top; the address keeps the choice (`?theme=…`) to share it. Each style only sets **tokens** (CSS variables under `:root[data-theme="…"]`): fonts, colors, radius, spacing. The components use nothing else, so that a style is cheap to add or tweak.
- The styles explore **new directions** for this application, its users and its subject. If the project has a `design-journal.md`, it records past experiences: it may inspire one style, never all of them, and nothing in it is a default.
- **Fonts the application can embed** (e.g. SIL Open Font License, from Google Fonts), preloaded with `font-display: block`, so that the page and its screenshots only finish loading once the fonts are there.
- **Icons as SVG lines** in the text color, not text symbols (⚙, ⌕, ✓), which render small and off-center.

Pitfalls met before:

- A class shared by two components (`top`, `online`) silently broke the layout twice: prefix the classes of the application (`app-`) and of the states (`is-`).
- A JavaScript function named like a browser global (`top`, `name`, `status`) breaks the page: give the components specific names.

## 2. Show it

Serve the repository root, so that the page reaches `assets/` even in a sandboxed browser (Flatpak, Snap) that only receives the HTML file; keep the server running in the background:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

The owner opens `http://127.0.0.1:8765/docs/mockups/<name>.html` and reloads after each change.

Before asking for a review, check each change with a headless screenshot (`scripts/screenshot.sh <url> <output.png> [width] [height | full]`) and look at it. To compare the styles at a glance, export one large PNG per style to `outputs/`.

The script uses **Playwright** and its own Chromium when installed, otherwise Firefox (normal or Flatpak). Prefer Playwright: it captures the whole page (`full`), and it prints the errors of the browser console (scripts, missing files) and fails on them, which a screenshot alone doesn't show. It is also the only choice when Claude Code runs in a sandbox that doesn't see the browsers of the system, such as VS Code installed as a Flatpak. Install it once, outside the projects (about 150 MB):

```sh
mkdir -p ~/.local/share/mockup-tools && cd ~/.local/share/mockup-tools
npm init -y && npm install playwright && npx playwright install chromium
```

## 3. Iterate with the owner

1. The owner picks a style, or mixes two. Iterate on it alone, **one change at a time** (the main color, then the logo, then a font…).
2. **Give each open decision its own control** in `VARIANTS`, so that the owner compares on screen instead of imagining; once decided, remove it and keep the choice in the tokens. About a hundred small decisions went this way on the first project, each in a minute. The control depends on the decision:
   - **A few distinct variants** (two button shapes, three header variants, five offsets…): a group of tabs, with the variants also side by side when the difference is fine.
   - **Values that combine** (a font per role, colors, sizes): one list per role (`select: true`, with the CSS `variable` it sets), which changes the page at once. The owner then tries every combination instead of waiting for a new board; a list "for everything" that the others follow until they are changed saves many clicks.
   - **Values tuned by eye** (a width, an angle, a darkness): a slider (`range`, with the CSS `variable` it sets), whose value shows beside it. The owner tunes it on their own screen, then sends back the address, which holds the values.
   - **The address keeps every choice**, so that the owner can reload the page or send the exact combination.
   - **An important element is shown alone and in real conditions**, with the interface behind it, both following the controls.
   - **Number the proposals once**, from 1 upward across every series: letters, or a numbering that starts again in each series, get mixed up ("the B" of which series?).
3. **Pixel alignments are tuned by eye on the owner's real screen**, with a tab of offsets (0, 0.5, 1, 1.5 px): the display scale of headless screenshots differs, so they only give the direction. Align icons on the lowercase letters next to them, not on the box of the text.
4. When the owner points at something, change only that, and say what changed.
5. From then on, **the mock-up is the reference** of the interface: say so in `specs.md`; the wireframe only fixed the first layout.

## 4. Sounds

When the interface makes sounds, the owner chooses them by ear on the mock-up, in the same rhythm: one kind of sound at a time (a success, a failure, a bump…), many candidates, a recommendation.

- **Each kind of sound is a group of tabs that plays its sound when a tab is chosen**: the owner hears it at once, without a second click. With many candidates, a tab shows the number of its sound alone, and a list in the section names each one, with a button ▶, its source and its length, the chosen one in bold.
- **A scene plays its sound in time with its animation**, at the moment that makes it (the contact of a bump, the start of a hop), once, after a click on its button ▶ (*Play with sound*). The scenes that loop stay silent, or the page becomes noise.
- **The browser plays a sound only after a click**: create the audio context (`AudioContext`) at the first click on the page, and resume it if it is suspended.
- **Match the loudness of the candidates**: the ear prefers the louder of two sounds. Measure the mean level of each file (`ffmpeg -i <file> -af volumedetect -f null -`) and bring them all to the same level with a gain, then add a **Volume** slider that applies to every sound at once.
- **Compare several temperatures side by side**: calm sounds, bolder ones (high temperature), wilder ones (explosive temperature). The owner may choose an unexpected sound, and the wild ones show where the limit is.
- **Mix three sources**: sounds synthesized in the browser with the Web Audio API (no file, no license), files from a CC0 library (Kenney's packs, mirrored on OpenGameArt with direct links), and sounds made by a script. Download only from sources that give a direct link: never work around the download flow of a site.
- **Make sounds with a reproducible script** rather than by hand: a recipe per sound (oscillators, frequency modulation, filtered noise, a plucked string, formants for a voice, echo, reverb, bit crushing), Python's standard library and ffmpeg to encode them, the noise seeded by the name of the sound, and the encoder made bit-exact (`-fflags +bitexact -flags:a +bitexact -serial_offset 1` for Ogg), so that running it again gives the same files. Live-coding tools (Strudel, TidalCycles, FoxDot, Sardine) are made to play music in loops and most need SuperCollider: too heavy for sound effects of a second.
- **A sound repeated at each step** (a move, a click) is heard in a scene at a faster speed too before it is decided, and played quieter than the others.
- **Check the terms of every source** before the owner chooses (the license file of each pack, its page), and write them with their date in a note of `docs/`.
- **Claude Code can't hear the sounds**: the names of the candidates say what was intended, not what was heard. Check every button in a headless browser instead (no error in the console, every file decoded, the audio context running), and say plainly that the owner's ear decides.

## 5. Finish: the design tokens

- Write the chosen style in `specs.md` (visual style section) as named tokens: colors (bands, text, weak text, accent, warning, error, the colors of the domain), sizes (spacing, radius, heights), typography (fonts, size and weight per role, number formatting), icons and images (source, license, what is bundled in `assets/` with an `assets/NOTICE.md`), shapes and motion.
- Remove the styles that were not chosen from the page, or keep them in a section that says they were rejected.
- If the project has a `design-journal.md` (or the template it came from), add an entry: the context, the choices kept, the ones rejected, and why.
- The application then implements exactly these tokens, in one module, so that changing a color or a size happens in one place.

Naming the values that the blocks wrote one by one (colors, sizes, weights, spacing) must not move the page by itself. Check it on every window, not on a few screenshots:

- **Capture every window before and after** (`node scripts/capture-windows.cjs <url> <folder>`, one PNG per window, pinned on whole pixels), then compare the two folders (`python3 scripts/compare-captures.py <before> <after> [marks]`): it lists the windows that differ, their pixels and the box around them. A renaming alone leaves every window the same.
- **A scale that merges values does move texts**: the owner compares it on the page. Give the tokens their new values, and keep the old ones in a temporary style sheet under an attribute of the page (`:root[data-sizes="hand"] .app-status { font-size: 12.5px; }`, generated from the blocks by a script), switched by a group of tabs of `VARIANTS`. Check that this tab equals the captures made before, then look at what the other tab changes, most changed windows first, and tell the owner where to look. Remove the style sheet and the tabs once decided.
