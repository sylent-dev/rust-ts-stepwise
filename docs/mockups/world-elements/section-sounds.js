// Section (step 11b): the sounds of a run, a success, a goal not met and a bump, compared by ear.

const SOUND_SCENES = [["success", "Every goal met"], ["failure", "A goal not met"], ["bumping", "A bump"]];

SECTIONS.push(["Sounds: success, goal not met, bump", () => `
  <p>Open: one sound for each end of a run, short and soft, never scolding. Each tab of <b>Success sound</b>, <b>Goal not met sound</b> and <b>Bump sound</b> plays its sound when it is chosen; the button ▶ of a scene plays it once from its start with the sounds chosen (a scene that loops stays silent). The <b>Volume</b> slider sets the level of every sound. 40 to 42, 47 to 49 and 54 to 56 are synthesized in the browser (no file); the others are files by Kenney under CC0. Their levels are matched roughly, so that a louder sound doesn't win by its loudness alone.</p>
  <div class="page-row">${SOUND_SCENES.map(([name, title]) =>
    `<div class="page-slot"><span>${title} <button type="button" class="sound-play" data-play-scene="sound-${name}">▶ Play with sound</button></span>${motionScene(name, { size: 64, sound: `sound-${name}` })}</div>`).join("")}</div>
  ${Object.entries(SOUNDS).map(([kind, { label, options }]) => `
    <h3>${label}</h3>
    <ul class="sound-list">${Object.entries(options).map(([value, { title, source, length }]) =>
      `<li><button type="button" class="sound-play" data-play-sound="${kind}:${value}" aria-label="Play ${title}">▶</button><span${chosen[`${kind}Sound`] === value ? ' class="is-chosen"' : ""}>${title}</span><small>${source} · ${length.toFixed(2)} s</small></li>`).join("")}</ul>`).join("")}`]);
