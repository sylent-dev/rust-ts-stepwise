### The texts of the interface in English, the reference language: every other language has the
### same files and the same messages. The syntax is Fluent's:
### https://projectfluent.org/fluent/guide/
###
### One file per domain, all read into one bundle (src/lib/i18n.ts): this one for the interface,
### `levels.ftl` for what the levels say, `errors.ftl` for the errors of the programs.
###
### The names. A test reads the code and these files, and holds what follows
### (src/lib/messages.spec.ts).
###
### - A message is named `<zone>-<thing>[-<part>]`, never with a single word. The zone is the block
###   of the interface that shows it (`settings-theme-note`); for a message that several blocks
###   show, it is what the message names (`screen-sandbox`, the name of a screen). The name says
###   where a message is and what it is there, not what its text says, which may change.
### - A family is the messages whose names hold a name of the data: the name of a theme, of a
###   level, later the code of an error. It has a prefix that no other message uses (`theme-`)
###   and one function that builds its names (`themeMessage`), which the code calls in place of
###   writing a name: the test knows each family by its function.
### - A message that the code doesn't read is removed. One that only other messages would read
###   is a term of Fluent (`-name`).

app-name = Stepwise
# The title of a page, in the tab of the browser.
# $page (String): the name of the screen (`screen-*`), or the title of the message in its place.
tab-title = { $page } · { app-name }

## The screens, as their links, their menus and their titles name them.

# The home screen, named after what it lists.
screen-home = All levels
# A level: `18. Paint a square`.
# $number (Number): the number of the level, from 1.
# $title (String): its title, a message of `levels.ftl`.
screen-level = { $number }. { $title }
screen-sandbox = Sandbox
screen-manual = Manual

## The menus of the level screen and of the sandbox. A row that leads to a screen takes its name
## above.

# The name of the bar of the menus, for a screen reader.
menus-name = Menus
menu-level = Level
menu-edit = Edit
menu-run = Run
menu-help = Help

## The commands of the level screen and of the sandbox, as a row of a menu names them, and later
## the tip of a button and the panel of the keyboard shortcuts: `command-<name>`
## (`commandMessage`).

# It asks before it acts: `…` ends its text (see Messages in docs/design-system.md).
command-restore-starting-code = Restore starting code…
command-undo = Undo
command-redo = Redo
command-comment-lines = Comment lines
command-move-line-up = Move line up
command-move-line-down = Move line down
# The same command while no program runs, while one runs, and while one is paused.
command-run = Run
command-pause = Pause
command-resume = Resume
command-step = Step
command-reset = Reset

## The three controls of a program, in the corner of the editor: each names itself in its tip
## by its command.

# Under the name of Reset in the tip of its button, so that it is never confused with Restore
# starting code, which replaces the code.
control-reset-help = Puts the map back. Your code stays.

## The speed of a program, which the menu **Run** chooses, and the status bar.

# The row of the menu **Run** that opens the speeds, and the name before the squares of the
# status bar that choose them.
speed-name = Speed
# A speed, named by the steps of the program that it runs each second.
# $steps (Number): the steps per second.
speed-steps =
    { $steps ->
        [one] { $steps } step per second
       *[other] { $steps } steps per second
    }
# The fastest speed: as many steps as the browser allows, without animation.
speed-instant = Instant

## The status bar, under the code, as in a code editor: the state of the program, the errors,
## the steps, the speed and the place of the cursor.

# Before Run or Step, and once Reset has put the map back.
status-ready = Ready
# While the program runs, the code can't be changed.
status-running = Running · Reset to edit
# $line (Number): the line of the next step, highlighted in the editor.
status-paused = Paused at line { $line } · Reset to edit
# An error stopped the program; the code can be changed again.
# $line (Number): the line of the error, marked in the editor.
status-failed = Error at line { $line }
# The program ended without error, and a goal of the map isn't met.
status-goal-not-met = Ended · goal not met
# The program ended with every goal of the map met.
# $map (Number): the number of the map among those of the level, as its tab names it.
status-map-passed = Ended · map { $map } passed
# The program ended, in the sandbox, which has no goal.
status-ended = Ended
# For a moment, in place of the state, when the learner types in the code while it is locked.
status-locked = Reset the program to edit your code.
# The errors that the checks underline in the code.
# $errors (Number): how many there are, never 0.
status-errors =
    { $errors ->
        [one] { $errors } error
       *[other] { $errors } errors
    }
# $steps (Number): the steps run so far.
status-steps =
    { $steps ->
        [one] { $steps } step
       *[other] { $steps } steps
    }
# The place of the cursor in the code.
# $line (Number): its line, from 1.
# $column (Number): its column, in characters from the start of the line, from 1.
status-cursor = Ln { $line }, Col { $column }
# The tip of the number of errors, which lists them in the console.
status-errors-show = Show in the console

## The console, under the map: the log of the last Run, what the program printed and the error
## that stopped it, or the errors that kept it from starting.

# Its name, on its tab.
console-name = Console
# Before any Run.
console-empty = Run your program to see what it prints.
# Above the lines kept, once earlier lines are gone.
# $kept (Number): the most lines that the console keeps.
console-cut = Earlier lines aren’t shown: the console keeps the last { $kept }.
# The line of an error, before its two sentences: the editor shows its place.
# $line (Number): the line, from 1.
console-line = Ln { $line }
# Under the errors that kept the program from starting: why nothing moved on the map.
# $errors (Number): how many there are, never 0.
console-fix = Fix { $errors ->
        [one] this error
       *[other] these { $errors } errors
    } to run the program.

## The keys that a shortcut names by a word, written beside its command: `key-<name>`
## (`keyMessage`). A letter, a sign, an arrow and a function key (F10) are shown as they are.

key-ctrl = Ctrl
# The key of the shortcuts on a computer of Apple, in place of Ctrl.
key-cmd = Cmd
key-shift = Shift
key-alt = Alt
key-enter = Enter

## The settings: the panel, which a header opens by its name or by a gear.

settings-title = Settings
settings-theme = Theme
settings-theme-note = Only the interface changes: the map keeps its look.
# The family of the themes, each named after the name the page takes: `theme-<name>`
# (`themeMessage`).
theme-day-desk = Day Desk
theme-night-desk = Night Desk

## What a panel over the screen shares.

# The tip of the cross that closes a panel.
panel-close = Close
# The button that closes a confirmation without doing what it asks.
panel-cancel = Cancel

## The confirmation of **Restore starting code** (see Code editor in specs.md): the question,
## what is lost for good, then the button that restores, the only one that acts. A level is named
## by its number and its title, the sandbox by its name.

# $level (String): the level, as `screen-level` writes it: `18. Paint a square`.
restore-question-level = Restore the starting code of { $level }?
restore-question-sandbox = Restore the starting code of the sandbox?
restore-lost-level = Your code will be replaced for good by the starting code of the level, as the first time.
restore-lost-sandbox = Your code will be replaced for good by the starting code of the sandbox, as the first time.
restore-action = Restore starting code

## The banner of a browser that refuses to save.

storage-refused = Your progress can’t be saved in this browser and will be lost when this tab closes.
# The tip of the cross that hides the banner.
storage-refused-hide = Hide until the next visit

## The messages in place of the screen (see Error handling in specs.md). The page writes the
## first three itself (`src/app.html`), for a browser where the application can't start: they
## take no value.

page-old-title = Stepwise needs a recent browser
page-old-text = This browser can’t run it. Update it, or open Stepwise in a recent Firefox, Chrome, Edge or Safari.
page-failed-title = Stepwise couldn’t load
page-failed-text = The connection seems to be lost. Check it, then try again.
page-failed-retry = Try again
page-no-script-title = Stepwise needs JavaScript
page-no-script-off = It is turned off in this browser.
page-no-script-fix = Turn it on for this website, then reload the page.
# What the message is about, in two or three signs, written large and hardly there behind it.
page-no-script-mark = JS

# An address that leads to no screen. Its button is `screen-home`.
missing-title = This page doesn’t exist
missing-text = Stepwise has no page at this address.
# What the message is about, as `page-no-script-mark`.
missing-mark = 404

window-small-title = Stepwise needs a larger window
# $least (String): the smallest size a screen fits in, as `window-size` writes it.
# $size (String): the size of the window, as `window-size` writes it; the interface draws it in
# bold, and it changes as the window does.
window-small-size = At least { $least } pixels. This one is { $size }.
# The family of what to do about a window too small, and only what can work:
# `window-advice-<advice>` (`adviceMessage`).
# $platform (String): `mac` on a computer of Apple, where the key that zooms is Cmd.
# The window can still grow on its screen.
window-advice-grow =
    { $platform ->
        [mac] Enlarge the window, or zoom out with Cmd and −.
       *[other] Enlarge the window, or zoom out with Ctrl and −.
    }
# The window already fills its screen, on a computer whose keyboard has the key F11.
window-advice-full-screen = Zoom out with Ctrl and −, or press F11 for the full screen.
# The window already fills its screen, and no sentence can name the key of the full screen: on a
# Mac or a Chromebook, or once the page is in full screen.
window-advice-zoom =
    { $platform ->
        [mac] Zoom out with Cmd and −.
       *[other] Zoom out with Ctrl and −.
    }
# A size in pixels.
# $width (String), $height (String): written as they are, without a separator of thousands.
window-size = { $width } × { $height }
window-phone-title = Stepwise needs a laptop
window-phone-text = It is made for a large window.

## The level screen and the sandbox.

# The name of the map, for a screen reader.
map-name = The map
# The name of the code in the editor, for a screen reader.
editor-name = Your code
# Under the pointer, on a line too long, underlined with dots: an advice, not an error.
# $length (Number): the longest line that reads well, in characters.
editor-long-line = Lines are easier to read under { $length } characters.
