<!-- The map: a world drawn from the core, with the goals of its level marked on it, each cell
     `side` pixels wide (see Map and Look of the world in specs.md). The drawings of the world
     elements are stacked in their cells; the map draws the rest from the cells: the lines every
     five cells, the paint strokes and the shadows of the walls. While a step runs, the map draws
     the world as the step found it, its robot moving and its paint changing (see Animations). -->
<script lang="ts">
	import type { Goals, World } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import Element from './element.svelte';
	import { CELL, paintAt, placedCells, placedFloors } from './geometry.ts';
	import { fiveLines, wallFaces, wallShadow } from './ground.ts';
	import { poseAt, restingPose, type Motion } from './motion.ts';
	import MovingPaint from './moving-paint.svelte';
	import { fadeOut, paintMotion, paintParts } from './paint-motion.ts';
	import PaintStroke from './paint-stroke.svelte';
	import Robot from './robot.svelte';

	interface Props {
		/** The world at rest, or as the step under way found it. */
		world: World;
		/** The goals of a map of a level; the sandbox has none. */
		goals?: Goals;
		/** The side of a cell, in pixels. */
		side: number;
		/** The step under way, if any. */
		motion?: Motion;
		/** How far the step under way has gone, from 0 to 1. */
		progress?: number;
	}

	let { world, goals, side, motion, progress = 0 }: Props = $props();

	/** Built once per step, not at each frame of its animation. */
	const paint = $derived(motion && paintMotion(world, motion.after));
	const strokes = $derived(paint?.kept ?? paintParts(world));
	const pose = $derived(motion ? poseAt(world.robot, motion, progress) : restingPose(world.robot));

	const floors = $derived(placedFloors(world));
	const walls = $derived(
		placedCells(world)
			.filter(({ cell }) => cell.type === 'wall')
			.map(({ x, y }) => ({ x, y, ...wallFaces(world, { x, y }) }))
	);

	/** The shadows are kept on the floor, by a clip of their own on each map of a page. */
	const id = $props.id();
	const floorClip = `${id}-floor`;
	const aheadClip = `${id}-ahead`;
</script>

<svg
	width={world.width * side}
	height={world.height * side}
	viewBox="0 0 {world.width * CELL} {world.height * CELL}"
	role="img"
	aria-label={t('map')}
>
	<defs>
		<clipPath id={floorClip}>
			{#each floors as { x, y } (`${x},${y}`)}
				<rect x={x * CELL} y={y * CELL} width={CELL} height={CELL} />
			{/each}
		</clipPath>
	</defs>

	{#each floors as { x, y } (`${x},${y}`)}
		<Element name="floor" {x} {y} />
	{/each}
	<!-- The walls over the floor, which they overlap by a unit, then their faces: each layer as
	     one mass. -->
	{#each walls as { x, y } (`${x},${y}`)}
		<Element name="wall" {x} {y} joined />
	{/each}
	{#each walls.filter(({ rim }) => rim) as { x, y } (`${x},${y}`)}
		<Element name="wallRim" {x} {y} joined />
	{/each}
	{#each walls.filter(({ edge }) => edge) as { x, y } (`${x},${y}`)}
		<Element name="wallEdge" {x} {y} joined />
	{/each}

	<g class="ink">
		{#each fiveLines(world) as line, index (index)}
			<rect {...line} />
		{/each}
	</g>

	{#each strokes as part (`${part.x},${part.y}`)}
		<PaintStroke {...part} />
	{/each}
	<!-- At the level of the paint, so that a stroke laid looks the same once the step has ended,
	     under the goal marks. -->
	{#if motion && paint}
		<MovingPaint before={world} {motion} {paint} {progress} {pose} clip={aheadClip} />
	{/if}

	{#if goals}
		<!-- A cell painted with the right color hides its mark: its paint shows that it is done. The
		     mark of a cell that the step under way paints so fades at the end of the step. -->
		{#each goals.paints as { at, color, passages } (`${at.x},${at.y}`)}
			{#if paintAt(world, at) !== color}
				<g
					class="goal-paint"
					style:--met={motion && paintAt(motion.after, at) === color ? fadeOut(progress) : 1}
				>
					<PaintStroke x={at.x} y={at.y} {color} {passages} />
				</g>
			{/if}
		{/each}
		{#each goals.itemsAt as { x, y } (`${x},${y}`)}
			<Element name="goalItem" {x} {y} />
		{/each}
		{#if goals.robotAt}
			<Element name="goalStand" x={goals.robotAt.x} y={goals.robotAt.y} />
		{/if}
	{/if}

	<!-- Over the paint and the goal marks, under the items and the robot. -->
	<g class="ink" clip-path="url(#{floorClip})">
		{#each walls as { x, y } (`${x},${y}`)}
			<rect {...wallShadow({ x, y })} />
		{/each}
	</g>

	{#each floors as { x, y, cell } (`${x},${y}`)}
		{#if cell.item}
			<Element name="item" {x} {y} />
		{/if}
	{/each}

	<Robot {pose} carrying={world.robot.carrying} />
</svg>

<style>
	svg {
		display: block;
		box-shadow: var(--map-shadow);
	}

	/* The lines every five cells and the shadows of the walls: the ink of the world at 10 %, the
	   ink of the robot. Each group is drawn as one, so that two shapes never make a darker
	   overlap. */
	.ink {
		fill: var(--robot-ink);
		opacity: 0.1;
	}

	/* A cell to paint: the stroke to paint, at 35 %; less as it fades once met. */
	.goal-paint {
		opacity: calc(0.35 * var(--met));
	}
</style>
