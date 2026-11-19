<!-- The robot at its pose, which may lie between two cells or two directions while it moves or
     turns, with its pincer when it comes out, the item of its bay and the item its pincer holds,
     its eyes at the end of a run, and larger with its shadow when it hops (see Animations in
     specs.md). -->
<svelte:options namespace="svg" />

<script lang="ts">
	import { BAY, type Carry } from './carry-motion.ts';
	import Element from './element.svelte';
	import { CELL, MIDDLE } from './geometry.ts';
	import type { Pose } from './motion.ts';
	import { HOP_GROWTH, hopShadow, type Eyes } from './run-end.ts';

	let { pose, carry, eyes }: { pose: Pose; carry: Carry; eyes?: Eyes } = $props();

	const shadow = $derived(hopShadow(pose));
	/** The robot a little larger in a hop, from its middle. */
	const grown = $derived(scaled(1 + HOP_GROWTH * (pose.lift ?? 0)));

	/** How far the pincer lies under the robot when it is in: 14 % of a cell, out of sight. */
	const PINCER_IN = 0.14 * CELL;

	/** The body of the robot in its drawing, without its tracks: the shape of its shadow. */
	const BODY = { x: 16, y: 14, width: 32, height: 36, rx: 9 } as const;

	/** The shadow of the item held, a little lower as the item grows, as if lifted. */
	const id = $props.id();
	const liftShadow = `${id}-lift`;
	const heldLift = $derived(carry.held ? 2 * (carry.held.size - 0.5) : 0);

	/**
	 * Draws an item along the robot: its middle `along` from the middle of the robot toward its
	 * back, at `size` of the item on the floor.
	 */
	function itemAt(along: number, size: number): string {
		return `translate(0 ${along}) ${scaled(size)}`;
	}

	/** Draws a drawing of a cell at `size`, from the middle of the cell. */
	function scaled(size: number): string {
		return `translate(${MIDDLE} ${MIDDLE}) scale(${size}) translate(${-MIDDLE} ${-MIDDLE})`;
	}
</script>

{#if shadow}
	<!-- The shadow of the body, under the robot that hops: it moves away toward the bottom left,
	     the sun being at the top right, whatever the robot faces. -->
	<g
		transform="translate({pose.x * CELL - shadow.reach} {pose.y * CELL +
			shadow.reach}) rotate({pose.angle} {MIDDLE} {MIDDLE})"
	>
		<rect class="hop-shadow" {...BODY} style:opacity={shadow.opacity} />
	</g>
{/if}

<!-- The drawing of the robot looks north, turned by the angle of its pose, larger as it hops. -->
<g
	transform="translate({pose.x * CELL} {pose.y *
		CELL}) rotate({pose.angle} {MIDDLE} {MIDDLE}) {grown}"
>
	<!-- The pincer slides out from under the front of the robot. -->
	{#if carry.pincer > 0}
		<g transform="translate(0 {(1 - carry.pincer) * PINCER_IN})">
			<Element name="pincer" />
		</g>
	{/if}
	<Element name="robot" />
	{#if eyes}
		<Element name={eyes} />
	{/if}
	{#if carry.bay !== undefined}
		<!-- The item in the middle of the bay, at half its size, or more as the bay swells; fading
		     in or out with less motion. -->
		<g transform={itemAt(BAY, carry.bay)} style:opacity={carry.bayOpacity}>
			<Element name="item" />
		</g>
	{/if}
	{#if carry.held}
		<defs>
			<filter id={liftShadow}>
				<feDropShadow class="lift" dx="0" dy={heldLift} stdDeviation="1" />
			</filter>
		</defs>
		<g transform={itemAt(carry.held.along, carry.held.size)} filter="url(#{liftShadow})">
			<Element name="item" />
		</g>
	{/if}
</g>

<style>
	/* The ink of the world, its opacity given by the height of the hop. */
	.hop-shadow {
		fill: var(--robot-ink);
	}

	/* The ink of the world, light: a shadow under the item lifted, as in the mock-up (tuned by
	   eye at step 11a). */
	.lift {
		flood-color: var(--robot-ink);
		flood-opacity: 0.33;
	}
</style>
