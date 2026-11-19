<!-- The block of the map on the level screen: the whole map, always, in its middle, its cells as
     large as the block allows up to the size of the drawings; no zoom, no scrolling (see Level
     screen in specs.md). Empty until the core has given the world. -->
<script lang="ts">
	import type { Goals, Outcome, World } from '#lib/core.ts';
	import { cellSide } from '#lib/map/fit.ts';
	import MapView from '#lib/map/map-view.svelte';
	import type { Motion } from '#lib/map/motion.ts';

	interface Props {
		/** The world at rest, or as the step under way found it. */
		world?: World;
		/** The goals of a map of a level; the sandbox has none. */
		goals?: Goals;
		/** The step under way, if any. */
		motion?: Motion;
		/** How far the step under way has gone, from 0 to 1. */
		progress?: number;
		/** How the run ended, once its last action has ended; nothing until then. */
		outcome?: Outcome;
	}

	let { world, goals, motion, progress, outcome }: Props = $props();

	/** The room the map has, inside the margin of the block. */
	let room = $state<DOMRectReadOnly>();
</script>

<div class="block" bind:contentRect={room}>
	{#if world && room}
		<MapView {world} {goals} side={cellSide(room, world)} {motion} {progress} {outcome} />
	{/if}
</div>

<style>
	/* The margin leaves room to the shadow of the map. */
	.block {
		flex: 1;
		display: grid;
		place-items: center;
		min-height: 0;
		padding: var(--space-40);
		overflow: hidden;
		background: var(--map-block);
	}
</style>
