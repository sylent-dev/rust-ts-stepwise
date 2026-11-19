### The texts of the interface in English, the reference language: every other language has the
### same files and the same messages. The syntax is Fluent's:
### https://projectfluent.org/fluent/guide/
###
### One file per domain, all read into one bundle (src/lib/i18n.ts): this one for the interface,
### `levels.ftl` for what the levels say, `bench.ftl` for the bench of the animations.
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
menu-help = Help

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
