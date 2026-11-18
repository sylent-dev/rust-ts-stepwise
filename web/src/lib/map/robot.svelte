<!-- The robot at its pose, which may lie between two cells or two directions while it moves or
     turns, with the item it carries in its bay. -->
<svelte:options namespace="svg" />

<script lang="ts">
	import Element from './element.svelte';
	import { CELL, MIDDLE } from './geometry.ts';
	import type { Pose } from './motion.ts';

	let { pose, carrying }: { pose: Pose; carrying: boolean } = $props();

	/** The middle of the bay, the light panel at the back of the robot, where its item lies. */
	const BAY = { x: 32, y: 39.5 };
</script>

<!-- The drawing of the robot looks north, turned by the angle of its pose. -->
<g transform="translate({pose.x * CELL} {pose.y * CELL}) rotate({pose.angle} {MIDDLE} {MIDDLE})">
	<Element name="robot" />
	{#if carrying}
		<!-- The item at half its size, its middle on the middle of the bay. -->
		<g transform="translate({BAY.x} {BAY.y}) scale(0.5) translate({-MIDDLE} {-MIDDLE})">
			<Element name="item" />
		</g>
	{/if}
</g>
