<!-- The robot at its pose, which may lie between two cells or two directions while it moves or
     turns, with its pincer when it comes out, the item of its bay and the item its pincer holds
     (see Animations in specs.md). -->
<svelte:options namespace="svg" />

<script lang="ts">
	import { BAY, type Carry } from './carry-motion.ts';
	import Element from './element.svelte';
	import { CELL, MIDDLE } from './geometry.ts';
	import type { Pose } from './motion.ts';

	let { pose, carry }: { pose: Pose; carry: Carry } = $props();

	/** How far the pincer lies under the robot when it is in: 14 % of a cell, out of sight. */
	const PINCER_IN = 0.14 * CELL;

	/** The shadow of the item held, a little lower as the item grows, as if lifted. */
	const id = $props.id();
	const liftShadow = `${id}-lift`;
	const lift = $derived(carry.held ? 2 * (carry.held.size - 0.5) : 0);

	/**
	 * Draws an item along the robot: its middle `along` from the middle of the robot toward its
	 * back, at `size` of the item on the floor.
	 */
	function itemAt(along: number, size: number): string {
		return `translate(${MIDDLE} ${MIDDLE + along}) scale(${size}) translate(${-MIDDLE} ${-MIDDLE})`;
	}
</script>

<!-- The drawing of the robot looks north, turned by the angle of its pose. -->
<g transform="translate({pose.x * CELL} {pose.y * CELL}) rotate({pose.angle} {MIDDLE} {MIDDLE})">
	<!-- The pincer slides out from under the front of the robot. -->
	{#if carry.pincer > 0}
		<g transform="translate(0 {(1 - carry.pincer) * PINCER_IN})">
			<Element name="pincer" />
		</g>
	{/if}
	<Element name="robot" />
	{#if carry.bay !== undefined}
		<!-- The item in the middle of the bay, at half its size, or more as the bay swells. -->
		<g transform={itemAt(BAY, carry.bay)}>
			<Element name="item" />
		</g>
	{/if}
	{#if carry.held}
		<defs>
			<filter id={liftShadow}>
				<feDropShadow class="lift" dx="0" dy={lift} stdDeviation="1" />
			</filter>
		</defs>
		<g transform={itemAt(carry.held.along, carry.held.size)} filter="url(#{liftShadow})">
			<Element name="item" />
		</g>
	{/if}
</g>

<style>
	/* The ink of the world, light: a shadow under the item lifted, as in the mock-up (tuned by
	   eye at step 11a). */
	.lift {
		flood-color: var(--robot-ink);
		flood-opacity: 0.33;
	}
</style>
