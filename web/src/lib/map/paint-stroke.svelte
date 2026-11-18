<!-- The paint of a cell, or of a cell to paint: a stroke from the middle of the cell toward each
     of its painted passages, where it meets the half of its neighbor, and a round end in the
     middle (see Map in specs.md). Each cell draws its half of a passage in its own color, so that
     a stroke changes color at the border between two cells. While a step takes paint away, a part
     of it may be drawn alone: some halves, without the middle. -->
<svelte:options namespace="svg" />

<script lang="ts">
	import type { Color, Direction } from '#lib/core.ts';
	import { CELL, MIDDLE, STEPS, STROKE } from './geometry.ts';

	interface Props {
		x: number;
		y: number;
		color: Color;
		passages: readonly Direction[];
		/** Whether the round middle is drawn. */
		middle?: boolean;
	}

	let { x, y, color, passages, middle = true }: Props = $props();
</script>

<g class={color} transform="translate({x * CELL} {y * CELL})">
	{#if middle}
		<circle cx={MIDDLE} cy={MIDDLE} r={STROKE / 2} />
	{/if}
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
