// The programs of the bench of the animations (step 14b), until the running of step 17 replaces
// it: short programs made for the map of the screen, each showing a few actions of the robot.

import type { RobotFailure, RunEnd } from '#lib/map/motion.ts';

/** A program of the bench. */
export interface BenchProgram {
	/** Its name, which names its message: `bench-program-<name>`. */
	name: string;
	text: string;
	/** The error of the robot it is made to stop on, if any. */
	fails?: RobotFailure;
	/** The end of a run it is made to show on the map of a level, if any. */
	ends?: RunEnd;
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

/**
 * A `pick_up()` on the cell where the robot starts, which has no item on the maps of the bench: on
 * a cell of the border, the robot steps back past it.
 */
const PICK_UP_NOTHING: BenchProgram = {
	name: 'pick-up-nothing',
	text: `pick_up()
`,
	fails: 'no-item-here'
};

/** A `drop()` with nothing carried, on the cell where the robot starts, as `PICK_UP_NOTHING`. */
const DROP_NOTHING: BenchProgram = {
	name: 'drop-nothing',
	text: `drop()
`,
	fails: 'not-carrying'
};

/** In the sandbox, the way from the robot to the item of the fifth row, which it picks up. */
const TO_THE_ITEM = `turn_right()
repeat 4:
    forward()
turn_left()
forward()
pick_up()
`;

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
`,
			ends: 'passed'
		},
		{
			// Three sides of the square: the two cells of the fourth one aren't painted.
			name: 'square-unfinished',
			text: `start_painting(red)
repeat 3:
    repeat 3:
        forward()
    turn_right()
stop_painting()
`,
			ends: 'goals-not-met'
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
		{
			name: 'bump-edge',
			text: `repeat 5:
    forward()
`,
			fails: 'bump'
		},
		PICK_UP_NOTHING,
		DROP_NOTHING,
		TURNS,
		WALK
	],
	// From the top left corner of the sandbox, facing east: its yellow stroke at the end of the
	// first row, its blue one two rows under the robot, its items on the third, fifth and seventh
	// rows, a wall from the second row of the fifth column.
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
		{
			name: 'carry',
			text: `${TO_THE_ITEM}repeat 2:
    forward()
drop()
`
		},
		{
			name: 'bump-wall',
			text: `repeat 4:
    forward()
turn_right()
forward()
`,
			fails: 'bump'
		},
		PICK_UP_NOTHING,
		DROP_NOTHING,
		{ name: 'pick-up-twice', text: `${TO_THE_ITEM}pick_up()\n`, fails: 'already-carrying' },
		{
			name: 'drop-on-item',
			text: `${TO_THE_ITEM}repeat 7:
    forward()
turn_left()
repeat 2:
    forward()
drop()
`,
			fails: 'item-already-here'
		},
		TURNS,
		WALK
	]
};

/** The programs of the bench for the map of a level, by its name, or of the sandbox. */
export function benchPrograms(map: string): readonly BenchProgram[] {
	return PROGRAMS[map] ?? [TURNS, WALK];
}
