<!-- The paint of a cell, or of a cell to paint: a stroke from the middle of the cell toward each
     of its painted passages, where it meets the half of its neighbor, and a round end in the
     middle (see Map in specs.md). Each cell draws its half of a passage in its own color, so that
     a stroke changes color at the border between two cells. -->
<svelte:options namespace="svg" />

<script lang="ts">
	import type { Color, Direction } from '#lib/core.ts';
	import { CELL, MIDDLE, STEPS } from './geometry.ts';

	interface Props {
		x: number;
		y: number;
		color: Color;
		passages: readonly Direction[];
	}

	let { x, y, color, passages }: Props = $props();

	/** The width of a stroke, 28/64 of a cell. */
	const STROKE = 28;
</script>

<g class={color} transform="translate({x * CELL} {y * CELL})">
	<circle cx={MIDDLE} cy={MIDDLE} r={STROKE / 2} />
	{#each passages as passage (passage)}
		<line
			x1={MIDDLE}
			y1={MIDDLE}
			x2={MIDDLE + MIDDLE * STEPS[passage].x}
			y2={MIDDLE + MIDDLE * STEPS[passage].y}
			stroke-width={STROKE}
		/>
	{/each}
</g>

<style>
	g {
		fill: var(--paint);
		stroke: var(--paint);
	}

	circle {
		stroke: none;
	}

	.red {
		--paint: var(--paint-red);
	}

	.yellow {
		--paint: var(--paint-yellow);
	}

	.blue {
		--paint: var(--paint-blue);
	}
</style>
