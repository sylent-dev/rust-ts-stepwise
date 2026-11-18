# The texts of the interface in English, the reference language: every other language has
# the same messages. The syntax is Fluent's: https://projectfluent.org/fluent/guide/

app-name = Stepwise
# The title of a page, in the tab of the browser.
# $page (String): the name of the screen, or the level with its number.
page-title = { $page } · { app-name }

## The screens, as their links, their menus and their titles name them.

sandbox = Sandbox
manual = Manual
all-levels = All levels

## The menus of the level screen and of the sandbox. A row that leads to a screen takes its name
## above.

# The name of the bar of the menus, for a screen reader.
menus = Menus
menu-level = Level
menu-help = Help

## The settings: the panel, which a header opens by its name or by a gear.

settings = Settings
settings-theme = Theme
settings-theme-note = Only the interface changes: the map keeps its look.
# The themes, each named after the name the page takes: `theme-<name>`.
theme-day-desk = Day Desk
theme-night-desk = Night Desk

## What a panel over the screen shares.

# The tip of the cross that closes a panel.
close = Close

## The banner of a browser that refuses to save.

storage-refused = Your progress can’t be saved in this browser and will be lost when this tab closes.
# The tip of the cross that hides the banner.
storage-refused-hide = Hide until the next visit

## The levels. The messages of a level are named after its stable name, the name of its file in
## `levels/`: `level-<name>-title`.

# A level as the interface names it: `18. Paint a square`.
# $number (Number): the number of the level, from 1.
# $title (String): its title.
level-numbered = { $number }. { $title }
level-paint-a-square-title = Paint a square

## The core.

core-load-failed = The core of Stepwise could not load.

## The probe of step 4c, on the real machine since step 10d: a program run on the map of the
## sandbox at each animation frame, on the page of the sandbox until the map view (step 14) and
## the running (step 17) replace it.

probe-title = A program run by the core, one step at a time
probe-map = The robot walking around the map of the sandbox.
probe-program = The program, the line of its next step marked
probe-run = Run
probe-pause = Pause
probe-reset = Reset
probe-speed = Speed
# $rate (Number): the steps run each second at this speed.
probe-speed-rate =
    { $rate ->
        [one] { $rate } step per second
       *[other] { $rate } steps per second
    }
probe-speed-instant = Instant
# $count (Number): the steps run since the start.
probe-steps =
    { $count ->
        [one] { $count } step
       *[other] { $count } steps
    }
# $count (Number): the steps run since the start.
# $rate (Number): the steps run each second at Instant, measured over the last second.
probe-steps-measured =
    { $count ->
        [one] { $count } step
       *[other] { $count } steps
    } · { $rate } steps per second measured
probe-stopped = The program has stopped.
