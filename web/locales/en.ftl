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

# An address that leads to no screen. Its button is `all-levels`.
missing-title = This page doesn’t exist
missing-text = Stepwise has no page at this address.
# What the message is about, as `page-no-script-mark`.
missing-mark = 404

window-small-title = Stepwise needs a larger window
# $least (String): the smallest size a screen fits in, as `window-size` writes it.
# $size (String): the size of the window, as `window-size` writes it; the interface draws it in
# bold, and it changes as the window does.
window-small-size = At least { $least } pixels. This one is { $size }.
# What to do about a window too small, and only what can work: `window-small-<advice>`.
# $platform (String): `mac` on a computer of Apple, where the key that zooms is Cmd.
# The window can still grow on its screen.
window-small-grow =
    { $platform ->
        [mac] Enlarge the window, or zoom out with Cmd and −.
       *[other] Enlarge the window, or zoom out with Ctrl and −.
    }
# The window already fills its screen, on a computer whose keyboard has the key F11.
window-small-full-screen = Zoom out with Ctrl and −, or press F11 for the full screen.
# The window already fills its screen, and no sentence can name the key of the full screen: on a
# Mac or a Chromebook, or once the page is in full screen.
window-small-zoom =
    { $platform ->
        [mac] Zoom out with Cmd and −.
       *[other] Zoom out with Ctrl and −.
    }
# A size in pixels.
# $width (String), $height (String): written as they are, without a separator of thousands.
window-size = { $width } × { $height }
window-phone-title = Stepwise needs a laptop
window-phone-text = It is made for a large window.

## The levels. The messages of a level are named after its stable name, the name of its file in
## `levels/`: `level-<name>-title`.

# A level as the interface names it: `18. Paint a square`.
# $number (Number): the number of the level, from 1.
# $title (String): its title.
level-numbered = { $number }. { $title }
level-paint-a-square-title = Paint a square

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
