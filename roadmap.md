# Roadmap

Implementation steps of the features described in [specs.md](specs.md). Each step is delivered in its own pull request, which checks its box.

## Reference

Read only by the steps that need them:

- [Technical choices](docs/technical-choices.md): the libraries, the services and the main designs, with their reasons.
- [Design system](docs/design-system.md): the tokens of the interface (the colors of the two themes, the typography, the spacing and the radii, the motion) and the writing rules of the messages.
- [Roadmap archive](docs/roadmap-archive.md): the detail of the steps done, moved there once their pull request is merged.
- [Backlog](docs/backlog.md): the ideas, polish and edge cases found along the way, until the owner makes them a step.
- [Quality audit](docs/quality-audit.md): the audit of step 15: the brief of each of its refactorings, what the steps 16 to 23 settle first, what is sound and should be copied.
- [GitHub Pages usage](docs/github-pages-usage.md): the limits and rules of the host of the website.
- [Sound sources](docs/sound-sources.md): the sources of the sounds compared at step 11b and their terms.
- [Font sources](docs/font-sources.md): the files of the three fonts, where they come from and their licenses.

## Steps

Design of the screens first (phases 3 and 4 of [process.md](process.md), with a sheet of the world elements before them), then a workspace that tries the riskiest part early (WebAssembly stepped at each frame, deployed), then the core in Rust, then the animations, the design system and the interface, then the content. This order departs from process.md on purpose (decided on 2026-11-10): the core doesn't depend on the mock-up, so it is built and tried with real programs first, and the animations and tokens are tuned closer to the code that uses them. Each step is split into sub-steps when it starts, if that helps. A row of a menu arrives with the step that codes its command, never greyed before it: a greyed row only means *not now*; a shortcut joins the panel **Keyboard shortcuts** the same way, once step 17 has brought the panel (decided on 2026-11-17).

Model: each step to come names its model. Fable 5.2 runs the steps whose design lasts and that the next ones copy (the design system, the shell of the application, the quality audit, the first levels and their pedagogy); Opus 5.5 runs the others, which build on decisions already made or are tuned with the owner (decided on 2026-11-10, each step named on 2026-11-15, to check at the retrospective). Fable 5.2 also runs the start of steps 16 and 17, where a design that the next steps copy is settled (the command of a screen, the edges of `Playback`), Opus 5.5 running the rest of each (decided on 2026-11-19, after the audit of step 15). At the start of a step whose model is not the one of the session, before anything else, ask the owner with a short form to switch with `/model`.

- [x] **0. Specifications** (#2)
- [x] **1. Sheet of the world elements** (#4, #5)
- [x] **2. Wireframes** (#6, #7, #8, #9)
- [x] **3. Mock-up** (#11, #12, #13, #14, #15, #16, #17)
- [x] **4. Workspace and probe** (#18, #19, #21, #22)
- [x] **5. Lexer** (#23)
- [x] **6. Parser** (#25, #26, #27)
- [x] **7. Checker** (#29, #30, #31)
- [x] **8. Map and levels** (#32, #33)
- [x] **9. Interpreter** (#34, #35, #36)
- [x] **10. WebAssembly bridge** (#37, #38, #39, #41)
- [x] **11. Animations and sounds** (#42, #45)
- [x] **12. Design system** (#46, #47, #48, #49)
- [x] **13. Application shell** (#50, #51, #52, #53)
- [x] **14. Map view** (#54, #55, #56, #57)
- [x] **15. Quality audit** (#58, #60, #61, #62, #63, #64, #66, #68)
- [x] **16. Code editor** (#70, #72, #73, #74, #75)
- [x] **17. Running** (#76, #77, #78, #79, #80, #81, #82)
- [x] **18. Sounds** (#84)
- [ ] **19. Breakpoints and variables** *(Opus 5.5)*, in two sub-steps (decided on 2026-11-24):
  - [ ] **19a. Breakpoints**: a click in the margin, left of the numbers, sets or removes a breakpoint, which follows its line as the code changes, is saved with the code (`LevelCode`, a field read alone, no new version) and can be set at any moment, even while the program runs; on a line that never starts a step, it goes to the next one that does, which the core gives (see [Quality audit](docs/quality-audit.md#smaller-notes)), or nothing is set. The program pauses before the line, once, when it starts, at **Instant** too (`pausesBefore` of `Playback`), and the bar says `Paused at line 10 · breakpoint · Reset to edit`. **Edit › Toggle breakpoint** (F9, the line of the cursor) and **Remove all breakpoints**, the row of F9 in the group **Run** of the panel **Keyboard shortcuts**; **Restore starting code…** takes them away too, and counts them in what it would restore.
  - [ ] **19b. Variables panel**: the tabs **Console** and **Variables** under the map, side by side under their titles from 1,600 pixels wide (the console stands alone under its tab until then, decided on 2026-11-23); the variables of the call shown, those that the last step changed standing out, and the calls in progress, a click on one showing its variables. Its tab opens by itself at a pause unless the learner chose the console since the program started; it follows the program as it runs, and keeps the state of the end once it has ended (decided on 2026-11-24). The size of a text given to the panel ([backlog](docs/backlog.md)).
- [ ] **20. Command menu** *(Opus 5.5)*: Ctrl+Space and **Edit › Commands**, the categories, the filter, the descriptions and examples, the snippets of the blocks, Tab and Enter to insert; its row (Ctrl+Space) in the group **Edit** of the panel **Keyboard shortcuts**. The names of the program at the cursor are asked to the core (see [Quality audit](docs/quality-audit.md#to-settle-first-by-step)).
- [ ] **21. Levels** *(Opus 5.5)*: the home screen with the chapters, the list of the levels with their order, the chapter and the number of the level in the header and the progress, whose bar gives the header its 3 pixels back (left out of step 13, which had no list to read them from), the levels opening in order and their codes (and the guide of the codes for the teachers, with its sentence for the learner who finds it), the goal and the hint, **Level › Goal**, **Previous level** and **Next level**, the variants and their marks, the goals not met shown on the map, the legend of the map with its new elements and **Help › Legend of the map**, the success panel, the messages of the level in the console (a goal not met, a map passed; decided on 2026-11-23), **Clear all progress**; a level still locked opened by its address, and the map shown kept in the address (to decide: a parameter, `/levels/18?map=2`, rather than a path, so that the maps stay one page).
- [ ] **22. Manual** *(Opus 5.5)*: its Markdown sections, its search, the section of the map with the drawing of each element, the addresses of its sections and the links from the levels, the command menu and the errors, **Help › Look up in the manual**, and the group **Manual** of the panel **Keyboard shortcuts** (F1 and Ctrl+click, which says Cmd+click on a computer of Apple: the keys written as a sentence in the panel don't follow the computer yet, seen in the review of step 17f); Ctrl+click on a word of the code and F1 at the cursor (see Code editor in `specs.md`), whole (decided on 2026-11-20): a word of the language opens its entry, a function of the program puts the cursor on its definition, which the core gives as the names of step 20; its examples checked by the tests.
- [ ] **23. Levels of chapters 1 to 4** *(Fable 5.2)*: First steps, Repeat, Paint, Decide; designed with the owner, each variant solved by a test, the harness of the solutions first (see [Quality audit](docs/quality-audit.md#to-settle-first-by-step)).
- [ ] **24. Levels of chapters 5 to 8** *(Fable 5.2)*: Loop until, Carry, Remember, Functions.
- [ ] **25. Sandbox** *(Opus 5.5)*: its open map, its saved code.
- [ ] **26. Content license** *(Opus 5.5)*: the code stays under MIT or Apache 2.0; the content (levels, drawings, sounds, texts of the manual) goes under CC BY-NC-ND 4.0, so that nobody sells it nor publishes a modified or extended copy of the game, a paid version on Steam being considered (see the [backlog](docs/backlog.md)). A license file for the content with the list of the folders it covers; a sentence in the README that grants more to teachers and trainers (using Stepwise in their lessons, paid ones included, and adapting the levels for their learners), since "non-commercial" is unclear for a paid training; the `license` field of `Cargo.toml` left to the code. What was published before under MIT or Apache 2.0 stays so for those versions. Not legal advice: to have read by a professional before a paid release (decided on 2026-11-10).
- [ ] **27. First release** *(Opus 5.5)*: a pass on every screen in Firefox, Chrome and Safari (or WebKit), the keyboard alone, the README (what Stepwise is, its address, how to develop it), version 0.1.0 and its tag.
