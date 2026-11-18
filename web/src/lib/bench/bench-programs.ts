// The programs of the bench of the animations (step 14b), until the running of step 17 replaces
// it: short programs made for the map of the screen, each showing a few actions of the robot.

/** A program of the bench. */
export interface BenchProgram {
	/** Its name, which names its message: `bench-program-<name>`. */
	name: string;
	text: string;
}

/** Turns on the spot, both ways, past each direction. */
const TURNS: BenchProgram = {
	name: 'turns',
	text: `repeat 4:
    turn_left()
repeat 4:
    turn_right()
`
};

/**
 * Walks the robot forward and turns it right at each wall, forever: along the border of an open
 * map. Each action takes three steps (the lines of the `while`, of the `if` and of the action).
 */
const WALK: BenchProgram = {
	name: 'walk',
	text: `while true:
    if front_is_clear():
        forward()
    else:
        turn_right()
`
};

/** The programs of each map, by the name of its level, or `sandbox`. */
const PROGRAMS: Readonly<Record<string, readonly BenchProgram[]>> = {
	// The square of the draft level, from its corner at the top left, facing east.
	'paint-a-square': [
		{
			name: 'square',
			text: `start_painting(red)
repeat 4:
    repeat 3:
        forward()
    turn_right()
stop_painting()
`
		},
		{
			name: 'paint-erase',
			text: `start_painting(blue)
repeat 3:
    forward()
start_painting(red)
turn_right()
forward()
turn_right()
turn_right()
start_erasing()
forward()
turn_left()
repeat 3:
    forward()
stop_erasing()
`
		},
		TURNS,
		WALK
	],
	// From the top left corner of the sandbox, facing east: its yellow stroke at the end of the
	// first row, its blue one two rows under the robot.
	sandbox: [
		{
			name: 'paint-over',
			text: `start_painting(red)
repeat 11:
    forward()
stop_painting()
`
		},
		{
			name: 'erase-blue',
			text: `turn_right()
forward()
forward()
turn_left()
start_erasing()
forward()
forward()
turn_right()
forward()
stop_erasing()
`
		},
		TURNS,
		WALK
	]
};

/** The programs of the bench for the map of a level, by its name, or of the sandbox. */
export function benchPrograms(map: string): readonly BenchProgram[] {
	return PROGRAMS[map] ?? [TURNS, WALK];
}
