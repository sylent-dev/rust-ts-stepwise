<!-- The block of the map on the level screen: the whole map, always, in its middle, its cells as
     large as the block allows up to the size of the drawings; no zoom, no scrolling (see Level
     screen in specs.md). Empty until the core has given the world. -->
<script lang="ts">
	import type { Goals } from '#lib/core/core.ts';
	import { cellSide } from '#lib/map/fit.ts';
	import MapView from '#lib/map/map-view.svelte';
	import type { Scene } from '#lib/map/scene.ts';

	interface Props {
		/** The world, and the program played on it, if any; nothing until the core has given it. */
		scene?: Scene;
		/** The goals of a map of a level; the sandbox has none. */
		goals?: Goals;
		/** The id of the block, which the tabs of the maps show. */
		id?: string;
		/** The id of the tab of the map shown, when the level has tabs: the block is its panel. */
		tab?: string;
	}

	let { scene, goals, id, tab }: Props = $props();

	/** The room the map has, inside the margin of the block. */
	let room = $state<DOMRectReadOnly>();
</script>

<div
	class="block"
	{id}
	role={tab === undefined ? undefined : 'tabpanel'}
	aria-labelledby={tab}
	bind:contentRect={room}
>
	{#if scene && room}
		<MapView {scene} {goals} side={cellSide(room, scene.world)} />
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
