### The bench of the animations (step 14b), in English: short programs played on the map of the
### screen, in the column of the code. The running (step 17) replaces the bench, and this file
### goes away with it (see interface.ftl for the rule of the names).

bench-title = Bench of the animations
bench-program = Program
# The family of the programs, each named after its name in the code: `bench-program-<name>`
# (`programMessage`).
bench-program-square = Paint the square
bench-program-square-unfinished = Paint three sides of the square
bench-program-square-ending-on-move = Paint the square, ending on a move
bench-program-paint-erase = Paint, then erase
bench-program-paint-over = Paint over the yellow
bench-program-erase-blue = Erase the blue
bench-program-carry = Pick up an item, then drop it
bench-program-bump-edge = Bump into the edge of the map
bench-program-bump-wall = Bump into a wall
bench-program-pick-up-nothing = Pick up where there is no item
bench-program-drop-nothing = Drop with nothing carried
bench-program-pick-up-twice = Pick up twice
bench-program-drop-on-item = Drop on another item
bench-program-turns = Turn left, then right
bench-program-walk = Walk along the walls, forever
bench-lines = The program, the line of its next step marked
bench-run = Run
bench-pause = Pause
bench-resume = Resume
bench-step = Step
bench-reset = Reset
bench-speed = Speed
# $rate (Number): the steps run each second at this speed.
bench-speed-rate =
    { $rate ->
        [one] { $rate } step per second
       *[other] { $rate } steps per second
    }
bench-speed-instant = Instant
# $count (Number): the steps run since the start.
bench-steps =
    { $count ->
        [one] { $count } step
       *[other] { $count } steps
    }
bench-ended = The program has ended.
bench-passed = The program has ended, every goal met.
bench-goals-not-met = The program has ended, a goal not met.
# $line (Number): the line of the error, from 1.
bench-failed = The program stopped on an error at line { $line }.
