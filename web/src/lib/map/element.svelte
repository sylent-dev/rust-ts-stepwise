<!-- A world element on the map: its drawing, the file of the sheet of step 1 used as it is, on
     the cell at `x` and `y`, or at the origin when what holds it places it. -->
<svelte:options namespace="svg" />

<script lang="ts">
	import { worldElements, type WorldElement } from '#lib/elements.ts';
	import { CELL } from './geometry.ts';

	interface Props {
		name: WorldElement;
		x?: number;
		y?: number;
		/**
		 * A part of the mass of the walls, which reaches one unit past its cell on each side: two
		 * walls side by side then meet without a seam, even where the edge between them falls
		 * between two pixels of the screen (a zoom of 125 or 150 %).
		 */
		joined?: boolean;
	}

	let { name, x = 0, y = 0, joined = false }: Props = $props();

	const reach = $derived(joined ? 1 : 0);
</script>

<image
	href={worldElements[name]}
	x={x * CELL - reach}
	y={y * CELL - reach}
	width={CELL + 2 * reach}
	height={CELL + 2 * reach}
/>
