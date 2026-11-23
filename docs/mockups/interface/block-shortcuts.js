// The panel of Help › Keyboard shortcuts, over a veil. Escape or × closes it. Each row says the
// text of its command, as its row of a menu does; Run, whose text follows the program, names all three.
function appShortcutsPanel() {
  const group = (title, rows) => `<div class="app-shortcuts-group"><h4>${title}</h4>${rows.map(([label, key]) => `<div class="app-shortcuts-row"><span>${label}</span><kbd>${appKeyLabel(key)}</kbd></div>`).join("")}</div>`;
  return `<div class="app-veil"><div class="app-popup app-shortcuts">
    <div class="app-shortcuts-head"><b>Keyboard shortcuts</b><button type="button" title="Close">${ICONS.close(16)}</button></div>
    <div class="app-shortcuts-columns">
      <div>
        ${group("Run", [["Run, Pause, Resume", KEYS.run], ["Step", KEYS.step], ["Reset", KEYS.reset], ["Toggle breakpoint", KEYS.breakpoint]])}
        ${group("Manual", [["Look up in the manual", KEYS.lookUp], ["Look up with the mouse", "Ctrl+click"]])}
      </div>
      ${group("Edit", [["Undo", KEYS.undo], ["Redo", KEYS.redo], ["Indent lines", "Tab"], ["Unindent lines", "Shift+Tab"], ["Comment lines", KEYS.comment], ["Move line up", KEYS.lineUp], ["Move line down", KEYS.lineDown], ["Commands", KEYS.commands], ["Leave the editor", KEYS.leaveEditor]])}
    </div>
  </div></div>`;
}
