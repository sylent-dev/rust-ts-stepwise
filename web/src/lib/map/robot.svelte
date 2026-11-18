<!-- The robot on its cell, turned to its direction, with the item it carries in its bay. -->
<svelte:options namespace="svg" />

<script lang="ts">
	import type { Direction, Robot } from '#lib/core.ts';
	import Element from './element.svelte';
	import { CELL, MIDDLE } from './geometry.ts';

	let { robot }: { robot: Robot } = $props();

	/** The drawing of the robot looks north: the angle it turns by to face each direction. */
	const ANGLES: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270 };

	/** The middle of the bay, the light panel at the back of the robot, where its item lies. */
	const BAY = { x: 32, y: 39.5 };
</script>

<g
	transform="translate({robot.position.x * CELL} {robot.position.y * CELL}) rotate({ANGLES[
		robot.direction
	]} {MIDDLE} {MIDDLE})"
>
	<Element name="robot" />
	{#if robot.carrying}
		<!-- The item at half its size, its middle on the middle of the bay. -->
		<g transform="translate({BAY.x} {BAY.y}) scale(0.5) translate({-MIDDLE} {-MIDDLE})">
			<Element name="item" />
		</g>
	{/if}
</g>
