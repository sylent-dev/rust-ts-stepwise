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
###
### A line or a column of the code is written without the commas of the thousands, as a code
### editor writes it (`Ln 1234`): `NUMBER($line, useGrouping: 0)`.

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
# Opens the command menu at the cursor of the code.
command-commands = Commands
# Sets or removes a breakpoint on the line of the cursor.
command-toggle-breakpoint = Toggle breakpoint
command-remove-all-breakpoints = Remove all breakpoints
# The same command while no program runs, while one runs, and while one is paused.
command-run = Run
command-pause = Pause
command-resume = Resume
command-step = Step
command-reset = Reset
# In the menu Help, and the title of the panel that it opens.
command-keyboard-shortcuts = Keyboard shortcuts

## The command menu, which Ctrl+Space opens at the cursor: its categories, the line of its keys,
## what it says when nothing matches the letters typed or when Your names has no name, what it
## says of a name of the program, then what it says of each word. Code is
## written between backticks, and shown in the font of the code.

# The family of the categories, in the order of the menu: `commands-category-<name>`
# (`categoryMessage`).
commands-category-move = Move
commands-category-paint = Paint
commands-category-carry = Carry
commands-category-sense = Sense
commands-category-write = Write
commands-category-colors = Colors
commands-category-control = Control
commands-category-logic = Logic
commands-category-variables = Variables
commands-category-functions = Functions
commands-category-names = Your names
# The list of the words, read to a screen reader: the text of the command that opens the menu.
commands-list-name = { command-commands }
# When no word holds the letters typed.
# $letters (String): the letters typed, as the learner typed them.
commands-empty = No command found with “{ $letters }”.
# The details of a name of the program, in Your names: what it is and the line where it is
# declared, which the details show under the sentence. A variable of a `let`.
# $line (Number): the line of its `let`, from 1.
commands-name-variable = A variable of your program, declared on line { NUMBER($line, useGrouping: 0) }.
# A parameter of the function whose body holds the cursor.
# $function (String): the name of that function, which the sentence writes with its parentheses.
# $line (Number): the line of its definition, from 1.
commands-name-parameter = A parameter of `{ $function }()`, on line { NUMBER($line, useGrouping: 0) }.
# A function of the program.
# $line (Number): the line of its definition, from 1.
commands-name-function = A function of your program, defined on line { NUMBER($line, useGrouping: 0) }.
# Your names without a name: none is declared above the cursor.
commands-names-none = Your variables and functions appear here once they are declared above the cursor.
# The same, when a syntax error above the cursor hides them.
# $line (Number): the line of the error.
commands-names-hidden = Your variables and functions appear here once the error on line { NUMBER($line, useGrouping: 0) } is fixed.
# The line of the keys, at the bottom of the menu: each key is drawn, then what it does.
commands-keys-move = move
commands-keys-category = category
# Between Tab and Enter, which both insert the word chosen.
commands-keys-or = or
commands-keys-insert = insert
commands-keys-close = close
commands-keys-search = type to search
# The family of what a built-in function is given, as the menu writes it between its
# parentheses: `start_painting(color)`, `print(value, …)`. `commands-given-<name>` (`givenMessage`).
commands-given-color = color
commands-given-values = value, …
# The family of the words, `commands-word-<word>-<part>` (`wordMessage`), each space and each
# underscore of the word written `-`: `text`, what the word does, in one sentence; `example`, a short program that uses
# it, which the tests check with the core.
commands-word-forward-text = Moves the robot one cell in front.
commands-word-forward-example =
    repeat 3:
        forward()
    turn_left()
commands-word-turn-left-text = Turns the robot a quarter turn to its left, on its cell.
commands-word-turn-left-example =
    turn_left()
    forward()
commands-word-turn-right-text = Turns the robot a quarter turn to its right, on its cell.
commands-word-turn-right-example =
    turn_right()
    forward()
commands-word-start-painting-text = Puts the brush down with a color: paints the cell of the robot, then every cell it moves into.
commands-word-start-painting-example =
    start_painting(red)
    forward()
commands-word-stop-painting-text = Lifts the brush: the robot moves on without painting.
commands-word-stop-painting-example =
    start_painting(blue)
    forward()
    stop_painting()
    forward()
commands-word-start-erasing-text = Puts the eraser down: takes the paint away from the cell of the robot, then from every cell it moves into.
commands-word-start-erasing-example =
    start_erasing()
    forward()
commands-word-stop-erasing-text = Lifts the eraser: the robot moves on without erasing.
commands-word-stop-erasing-example =
    start_erasing()
    forward()
    stop_erasing()
    forward()
commands-word-pick-up-text = Picks up the item on the cell of the robot.
commands-word-pick-up-example =
    if item_here():
        pick_up()
commands-word-drop-text = Drops the item that the robot carries, on its cell.
commands-word-drop-example =
    pick_up()
    forward()
    drop()
commands-word-front-is-clear-text = `true` when the cell in front is a floor cell.
commands-word-front-is-clear-example =
    while front_is_clear():
        forward()
commands-word-left-is-clear-text = `true` when the cell on the left is a floor cell.
commands-word-left-is-clear-example =
    if left_is_clear():
        turn_left()
commands-word-right-is-clear-text = `true` when the cell on the right is a floor cell.
commands-word-right-is-clear-example =
    if right_is_clear():
        turn_right()
commands-word-here-is-text = `true` when the cell of the robot has that paint.
commands-word-here-is-example =
    if here_is(red):
        turn_right()
commands-word-front-is-text = `true` when the cell in front has that paint, `false` for a wall.
commands-word-front-is-example =
    if front_is(blue):
        forward()
commands-word-left-is-text = `true` when the cell on the left has that paint, `false` for a wall.
commands-word-left-is-example =
    if left_is(yellow):
        turn_left()
commands-word-right-is-text = `true` when the cell on the right has that paint, `false` for a wall.
commands-word-right-is-example =
    if right_is(yellow):
        turn_right()
commands-word-item-here-text = `true` when an item lies on the cell of the robot.
commands-word-item-here-example =
    if item_here():
        pick_up()
commands-word-item-in-front-text = `true` when an item lies on the cell in front.
commands-word-item-in-front-example =
    while not item_in_front():
        forward()
commands-word-is-carrying-text = `true` when the robot carries an item.
commands-word-is-carrying-example =
    if is_carrying():
        drop()
commands-word-is-painting-text = `true` when the brush is down.
commands-word-is-painting-example =
    if is_painting():
        stop_painting()
commands-word-is-erasing-text = `true` when the eraser is down.
commands-word-is-erasing-example =
    if is_erasing():
        stop_erasing()
commands-word-print-text = Writes its values to the console, on one line, separated by spaces.
commands-word-print-example =
    let sides = 4
    print("Sides:", sides)
commands-word-red-text = The red paint, for the brush and the sensors.
commands-word-red-example =
    start_painting(red)
    forward()
commands-word-yellow-text = The yellow paint, for the brush and the sensors.
commands-word-yellow-example =
    if here_is(yellow):
        turn_left()
commands-word-blue-text = The blue paint, for the brush and the sensors.
commands-word-blue-example =
    if front_is(blue):
        turn_right()
commands-word-if-text = Runs its block when the condition is `true`.
commands-word-if-example =
    if front_is_clear():
        forward()
commands-word-else-if-text = After an `if`: runs its block when the conditions above are `false` and its own is `true`.
commands-word-else-if-example =
    if front_is_clear():
        forward()
    else if left_is_clear():
        turn_left()
commands-word-else-text = After an `if`: runs its block when every condition above is `false`.
commands-word-else-example =
    if front_is_clear():
        forward()
    else:
        turn_right()
commands-word-while-text = Runs its block again and again, as long as the condition is `true`.
commands-word-while-example =
    while front_is_clear():
        forward()
commands-word-repeat-text = Runs its block a number of times.
commands-word-repeat-example =
    repeat 4:
        forward()
        turn_right()
commands-word-break-text = Leaves the loop that it is in, at once.
commands-word-break-example =
    while true:
        if item_here():
            break
        forward()
commands-word-not-text = Turns a condition around: `true` when it is `false`.
commands-word-not-example =
    while not front_is_clear():
        turn_left()
commands-word-and-text = `true` when the conditions on both sides are `true`.
commands-word-and-example =
    let busy = is_carrying()
    if busy and item_here():
        forward()
commands-word-or-text = `true` when one of the two conditions is `true`, or both.
commands-word-or-example =
    let done = item_here()
    if done or here_is(blue):
        turn_left()
commands-word-true-text = The value of a condition that holds.
commands-word-true-example =
    let looking = true
    while looking:
        forward()
        if item_here():
            looking = false
commands-word-false-text = The value of a condition that does not hold.
commands-word-false-example =
    let found = false
    if item_here():
        found = true
    print(found)
commands-word-let-text = Declares a variable and gives it its first value.
commands-word-let-example =
    let sides = 0
    while sides < 4:
        forward()
        sides = sides + 1
commands-word-function-text = Defines a function: a block that runs each time a line calls it by its name.
commands-word-function-example =
    function turn_around():
        turn_left()
        turn_left()
    turn_around()
commands-word-return-text = Leaves the function, and gives back the value after it, if there is one.
commands-word-return-example =
    function double(number):
        return number * 2
    print(double(3))

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
status-paused = Paused at line { NUMBER($line, useGrouping: 0) } · Reset to edit
# The same, once a breakpoint of that line has paused the program.
# $line (Number): the line of the breakpoint, highlighted in the editor.
status-paused-breakpoint = Paused at line { NUMBER($line, useGrouping: 0) } · breakpoint · Reset to edit
# An error stopped the program; the code can be changed again.
# $line (Number): the line of the error, marked in the editor.
status-failed = Error at line { NUMBER($line, useGrouping: 0) }
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
status-cursor = Ln { NUMBER($line, useGrouping: 0) }, Col { NUMBER($column, useGrouping: 0) }
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
console-cut = Earlier lines are not shown: the console keeps the last { $kept }.
# The line of an error, before its two sentences: the editor shows its place.
# $line (Number): the line, from 1.
console-line = Ln { NUMBER($line, useGrouping: 0) }
# Under the errors that kept the program from starting: why nothing moved on the map.
# $errors (Number): how many there are, never 0.
console-fix = Fix { $errors ->
        [one] this error
       *[other] these { $errors } errors
    } to run the program.

## The variables panel, under the map beside the console: the variables of the call shown, and
## the calls in progress. In the font of the code, as the console.

# Its name, on its tab.
variables-name = Variables
# Before any Run or Step, and once Reset has put the map back.
variables-empty = Pause the program to see its variables.
# Above the variables of the main program.
variables-in-main = in the main program
# Above the variables of a function.
# $function (String): its name, as the program writes it.
variables-in-function = in { $function }
# In place of the variables of a call that has none yet.
variables-none = No variables yet.
# Above the calls in progress, from the main program to the function being run.
variables-calls = Calls
# A call in progress: the main program, with the line it is on.
# $line (Number): the line, from 1.
variables-call-main = main program · Ln { NUMBER($line, useGrouping: 0) }
# A call of a function in progress, with the line it is on: the line of its call when it waits
# for another call to end.
# $function (String): the name of the function, as the program writes it.
# $line (Number): the line, from 1.
variables-call-function = { $function } · Ln { NUMBER($line, useGrouping: 0) }
# Read to a screen reader on the tab Variables, while a dot on it says that it holds the state of
# the program at the error that stopped it.
variables-dot = Holds the state at the error.

## The two tabs of the console and the variables, under the map, below 1,600 pixels wide.

# The name of the row of the tabs, read to a screen reader.
panels-name = Console and variables

## The keys that a shortcut names by a word, written beside its command: `key-<name>`
## (`keyMessage`). A letter, a sign, an arrow and a function key (F10) are shown as they are.

key-ctrl = Ctrl
# The key of the shortcuts on a computer of Apple, in place of Ctrl.
key-cmd = Cmd
key-shift = Shift
key-alt = Alt
key-enter = Enter
key-tab = Tab
key-space = Space
# The key Escape, as printed on most keyboards.
key-escape = Esc

## The settings: the panel, which a header opens by its name or by a gear.

settings-title = Settings
settings-theme = Theme
settings-theme-note = Only the interface changes: the map keeps its look.
# The family of the themes, each named after the name the page takes: `theme-<name>`
# (`themeMessage`).
theme-day-desk = Day Desk
theme-night-desk = Night Desk
# Whether a run plays its sounds, without a sentence: its two values say it.
settings-sounds = Sounds
# The family of the values of Sounds: `sounds-<value>` (`soundsMessage`).
sounds-off = Off
sounds-on = On

## The panel of the keyboard shortcuts: the titles of its groups, then the rows that the text of
## a command doesn't name. Its title is the text of the command that opens it.

shortcuts-group-run = Run
shortcuts-group-edit = Edit
# The row of one command, one shortcut, which the menu names by what it does now: its three
# texts, as the menu writes them.
shortcuts-run = { command-run }, { command-pause }, { command-resume }
# Tab and Shift+Tab, on the selected lines, or on the line of the cursor.
shortcuts-indent-lines = Indent lines
shortcuts-unindent-lines = Unindent lines
# Tab belongs to the code: the keyboard leaves it with Escape, then Tab.
shortcuts-leave-editor = Leave the editor
# The keys of `shortcuts-leave-editor`, pressed one after the other.
shortcuts-leave-editor-keys = { key-escape }, then { key-tab }

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

storage-refused = Your progress cannot be saved in this browser and will be lost when this tab closes.
# The tip of the cross that hides the banner.
storage-refused-hide = Hide until the next visit

## The messages in place of the screen (see Error handling in specs.md). The page writes the
## first three itself (`src/app.html`), for a browser where the application can't start: they
## take no value.

page-old-title = Stepwise needs a recent browser
page-old-text = This browser cannot run it. Update it, or open Stepwise in a recent Firefox, Chrome, Edge or Safari.
page-failed-title = Stepwise could not load
page-failed-text = The connection seems to be lost. Check it, then try again.
page-failed-retry = Try again
page-no-script-title = Stepwise needs JavaScript
page-no-script-off = It is turned off in this browser.
page-no-script-fix = Turn it on for this website, then reload the page.
# What the message is about, in two or three signs, written large and hardly there behind it.
page-no-script-mark = JS

# An address that leads to no screen. Its button is `screen-home`.
missing-title = This page does not exist
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
