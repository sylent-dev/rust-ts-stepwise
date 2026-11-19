// The paint of the map while a step runs (see Animations in specs.md): what stays as it was, what
// the step takes away, the stroke the brush lays and the ring of a tool put down. Everything is in
// the units of the drawings (geometry.ts); the reference is the mock-up,
// `docs/mockups/world-elements/motion.js`.

import type { Color, Direction, Paint, Point, World } from '#lib/core/core.ts';
import { CELL, MIDDLE, STEPS, cellAt, placedFloors } from './geometry.ts';
import type { Rect } from './ground.ts';
import type { Motion, Pose } from './motion.ts';

/**
 * A part of the paint of a cell: its color, whether its round middle is drawn, and its halves of
 * passages, each drawn by the cell in its own color (see Map in specs.md).
 */
export interface PaintPart extends Point {
	color: Color;
	middle: boolean;
	passages: readonly Direction[];
}

/** The paint of a world, each painted cell drawn whole. */
export function paintParts(world: World): PaintPart[] {
	return placedFloors(world).flatMap(({ x, y, cell }) =>
		cell.paint
			? [{ x, y, color: cell.paint.color, middle: true, passages: cell.paint.passages }]
			: []
	);
}

/** The paint of the map during a step, from the world as the step found it. */
export interface PaintMotion {
	/** What the step leaves as it was. */
	kept: PaintPart[];
	/**
	 * What the step takes away under the robot: the middle of the cell it ends on and the halves
	 * of the passage it crosses. It shows until the back of the robot has passed over it, so that
	 * the floor comes out clean behind the robot.
	 */
	under: PaintPart[];
	/** What the step takes away beside the robot, which fades at the end of the step. */
	beside: PaintPart[];
	/**
	 * The new color, beside the robot, of a cell that the brush paints over: it shows under the
	 * old color as that one fades, so that the floor never shows between the two.
	 */
	repainted: PaintPart[];
	/**
	 * The paint that comes beside the robot where there was none: the halves of a cell erased
	 * alone, toward its painted neighbors, once the brush paints it again. It fades in at the end
	 * of the step.
	 */
	appearing: PaintPart[];
}

function same(a: Point, b: Point): boolean {
	return a.x === b.x && a.y === b.y;
}

function shows(part: PaintPart): boolean {
	return part.middle || part.passages.length > 0;
}

/** The paint of the cell at a place, if it is a painted floor. */
function paintOf(world: World, at: Point): Paint | undefined {
	const cell = cellAt(world, at);
	return cell?.type === 'floor' ? cell.paint : undefined;
}

/**
 * What the step from `before` to `after` does to the paint: what it keeps, what it takes away
 * (what an eraser passes over, or the old color of a cell that a brush paints over), and what it
 * brings beside the robot. The paint that the brush lays along the way of the robot is the
 * stroke laid (`laidStroke`); under the robot, the new paint shows once the step has ended. A
 * cell keeps the part of its paint that `after` gives in the same color.
 */
export function paintMotion(before: World, after: World): PaintMotion {
	const from = before.robot.position;
	const to = after.robot.position;
	/** Whether the robot crosses the passage of the cell at `at` toward `side`. */
	const crossed = (at: Point, side: Direction): boolean => {
		const next = { x: at.x + STEPS[side].x, y: at.y + STEPS[side].y };
		return (same(at, from) && same(next, to)) || (same(at, to) && same(next, from));
	};
	const motion: PaintMotion = { kept: [], under: [], beside: [], repainted: [], appearing: [] };
	for (const { x, y, cell } of placedFloors(before)) {
		if (!cell.paint) continue;
		const { color, passages } = cell.paint;
		const now = paintOf(after, { x, y });
		const stays = now?.color === color ? now : undefined;
		if (stays) {
			const kept = passages.filter((side) => stays.passages.includes(side));
			motion.kept.push({ x, y, color, middle: true, passages: kept });
		}
		const lost = passages.filter((side) => !stays?.passages.includes(side));
		const here = same({ x, y }, to);
		const under = {
			x,
			y,
			color,
			middle: !stays && here,
			passages: lost.filter((side) => crossed({ x, y }, side))
		};
		const beside = {
			x,
			y,
			color,
			middle: !stays && !here,
			passages: lost.filter((side) => !crossed({ x, y }, side))
		};
		if (shows(under)) motion.under.push(under);
		if (shows(beside)) motion.beside.push(beside);
	}
	for (const { x, y, cell } of placedFloors(after)) {
		if (!cell.paint) continue;
		const { color, passages } = cell.paint;
		const was = paintOf(before, { x, y });
		const stayed = was?.color === color ? was : undefined;
		const coming = {
			x,
			y,
			color,
			middle: !stayed && !same({ x, y }, to),
			passages: passages.filter(
				(side) => !stayed?.passages.includes(side) && !crossed({ x, y }, side)
			)
		};
		if (shows(coming)) (was ? motion.repainted : motion.appearing).push(coming);
	}
	return motion;
}

/**
 * How far behind its middle the paint taken away goes under the robot, 14 units: inside its back,
 * which lies 18.75 units from its middle, where its rounded corners still cover the whole width
 * of a stroke.
 */
const CLEAN = 14;

/** Far enough to reach past any map, from any of its cells. */
const BEYOND = 64 * CELL;

/**
 * The part of the map ahead of the back of the robot at `pose`, facing `direction`: the paint
 * taken away under the robot still shows there.
 */
export function aheadOfBack(pose: Pose, direction: Direction): Rect {
	const step = STEPS[direction];
	const back = {
		x: pose.x * CELL + MIDDLE - step.x * CLEAN,
		y: pose.y * CELL + MIDDLE - step.y * CLEAN
	};
	const x = step.x > 0 ? back.x : step.x < 0 ? back.x - BEYOND : -BEYOND;
	const y = step.y > 0 ? back.y : step.y < 0 ? back.y - BEYOND : -BEYOND;
	return {
		x,
		y,
		width: step.x === 0 ? 2 * BEYOND : BEYOND,
		height: step.y === 0 ? 2 * BEYOND : BEYOND
	};
}

/** The share of the time after which what goes beside the robot starts to fade. */
export const FADE_FROM = 0.7;

/**
 * The opacity at `t` of the step, from 0 to 1, of what goes beside the robot: the paint taken
 * away, the mark of a goal met. It fades over the last 30 % of the step, so that the last frame
 * of the step leads to the map at rest without a jump.
 */
export function fadeOut(t: number): number {
	return t < FADE_FROM ? 1 : Math.max((1 - t) / (1 - FADE_FROM), 0);
}

/** A straight stroke of paint, from a point to another, in the units of the drawings. */
export interface Stroke {
	color: Color;
	from: Point;
	to: Point;
}

/**
 * The stroke the brush lays during a move, from the middle of the cell the robot leaves to its
 * own middle at `pose`: it comes out from under the robot. Nothing when the brush is up or the
 * robot doesn't move.
 */
export function laidStroke(before: World, motion: Motion, pose: Pose): Stroke | undefined {
	const tool = motion.after.robot.tool;
	if (motion.action !== 'moved' || tool?.type !== 'brush') return undefined;
	const { x, y } = before.robot.position;
	return {
		color: tool.color,
		from: { x: x * CELL + MIDDLE, y: y * CELL + MIDDLE },
		to: { x: pose.x * CELL + MIDDLE, y: pose.y * CELL + MIDDLE }
	};
}

/** Half the width of the robot with its tracks, where the ring of a tool starts. */
const ROBOT_HALF = 21;

/** The ring of a tool put down: in the color of the brush, or the gray of the eraser. */
export interface Ring extends Point {
	tool: Color | 'eraser';
	radius: number;
	width: number;
	opacity: number;
}

/**
 * The ring of a tool put down at `t` of the step: it grows from under the robot as it fades, at
 * an even pace from the first frame, since the robot covers the paint of its cell. Nothing for
 * another action.
 */
export function ringAt(before: World, motion: Motion, t: number): Ring | undefined {
	const tool = motion.after.robot.tool;
	if (motion.action !== 'started-painting' && motion.action !== 'started-erasing') {
		return undefined;
	}
	if (!tool) return undefined;
	const { x, y } = before.robot.position;
	return {
		x: x * CELL + MIDDLE,
		y: y * CELL + MIDDLE,
		tool: tool.type === 'brush' ? tool.color : 'eraser',
		radius: ROBOT_HALF + 16 * t,
		width: 5 * (1 - t) + 1,
		opacity: 1 - t
	};
}
