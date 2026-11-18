<!-- The paint that moves while a step runs (see Animations in specs.md): the paint taken away,
     which goes under the robot and fades beside it, the new color of a cell painted over, which
     shows as the old one fades, the stroke that the brush lays behind the robot, and the ring of
     a tool put down. Over the paint that stays, under the goal marks, the
     shadows of the walls, the items and the robot. -->
<svelte:options namespace="svg" />

<script lang="ts">
	import type { World } from '#lib/core.ts';
	import { STROKE } from './geometry.ts';
	import type { Motion, Pose } from './motion.ts';
	import {
		aheadOfBack,
		FADE_FROM,
		fadeOut,
		laidStroke,
		ringAt,
		type PaintMotion
	} from './paint-motion.ts';
	import PaintStroke from './paint-stroke.svelte';

	interface Props {
		/** The world as the step found it. */
		before: World;
		motion: Motion;
		/** What the step does to the paint. */
		paint: PaintMotion;
		/** How far the step has gone, from 0 to 1. */
		progress: number;
		/** Where the robot stands at that moment. */
		pose: Pose;
		/** The name of the clip of the paint under the robot, one per map of a page. */
		clip: string;
	}

	let { before, motion, paint, progress, pose, clip }: Props = $props();

	const ahead = $derived(aheadOfBack(pose, before.robot.direction));
	const stroke = $derived(laidStroke(before, motion, pose));
	const ring = $derived(ringAt(before, motion, progress));
</script>

<defs>
	<clipPath id={clip}>
		<rect {...ahead} />
	</clipPath>
</defs>

<!-- Under the old color, which covers it whole until it fades. -->
{#if progress >= FADE_FROM}
	{#each paint.repainted as part (`${part.x},${part.y}`)}
		<PaintStroke {...part} />
	{/each}
{/if}
<!-- Each group drawn as one, so that two halves never make a darker overlap as they fade. -->
<g opacity={1 - fadeOut(progress)}>
	{#each paint.appearing as part (`${part.x},${part.y}`)}
		<PaintStroke {...part} />
	{/each}
</g>
<g clip-path="url(#{clip})">
	{#each paint.under as part (`${part.x},${part.y}`)}
		<PaintStroke {...part} />
	{/each}
</g>
<g opacity={fadeOut(progress)}>
	{#each paint.beside as part (`${part.x},${part.y}`)}
		<PaintStroke {...part} />
	{/each}
</g>

{#if stroke}
	<line
		class="paint"
		x1={stroke.from.x}
		y1={stroke.from.y}
		x2={stroke.to.x}
		y2={stroke.to.y}
		stroke-width={STROKE}
		style:--paint="var(--paint-{stroke.color})"
	/>
{/if}

{#if ring}
	<circle
		class="ring"
		cx={ring.x}
		cy={ring.y}
		r={ring.radius}
		stroke-width={ring.width}
		opacity={ring.opacity}
		style:--paint={ring.tool === 'eraser' ? 'var(--robot-eyes-dim)' : `var(--paint-${ring.tool})`}
	/>
{/if}

<style>
	.paint {
		stroke: var(--paint);
		stroke-linecap: round;
	}

	.ring {
		fill: none;
		stroke: var(--paint);
	}
</style>
