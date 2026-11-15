# The texts of the interface in English, the reference language: every other language has
# the same messages. The syntax is Fluent's: https://projectfluent.org/fluent/guide/

app-name = Stepwise
app-tagline = Learn to program step by step.

## The page of step 4b, replaced by the home screen in step 13.

# $version (String): the version of the core, as the WebAssembly module gives it.
core-version = Core { $version }, computed in Rust.
core-load-failed = The core of Stepwise could not load.

## The probe of step 4c, on the real machine since step 10d: a program run on the map of the
## sandbox at each animation frame, replaced by the level screen of step 13 onward.

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
