// The program of the probe (see probe.svelte), apart from its component so that a test runs it.

/**
 * Walks the robot forward and turns it right at each wall, forever: around the map of the
 * sandbox, along its border. Each action takes three steps (the lines of the `while`, of the
 * `if` and of the action), so the highlighted line moves three times for one move of the robot.
 */
export const PROBE_PROGRAM = `while true:
    if front_is_clear():
        forward()
    else:
        turn_right()
`;
