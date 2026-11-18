<!-- A choice between a few values side by side, the one chosen filled with the color of the
     text: the theme in the settings. They are the radio buttons of the browser, drawn as
     segments: Tab stops once on the group, the arrows go from a value to the next and choose
     it, as the pointer does. When the value changes, the fill slides to its segment and the
     texts turn with it (see Motion in docs/design-system.md). -->
<script lang="ts" generics="Value extends string">
	import { fillAt } from './segments.ts';

	interface Props {
		/** The `id` of the text that names the choice. */
		labelledby: string;
		/** The `id` of the sentence that says more about the choice, when it has one. */
		describedby?: string;
		/** The values, from left to right, each with its text. */
		options: readonly { value: Value; label: string }[];
		/** The value chosen. */
		value: Value;
		onchoose: (value: Value) => void;
	}

	let { labelledby, describedby, options, value, onchoose }: Props = $props();

	/** What makes one group of the radio buttons. */
	const group = $props.id();

	/** The box of each segment as the browser lays it out, given again each time it changes. */
	let boxes: (ResizeObserverSize[] | undefined)[] = $state([]);

	/** Where the fill stands: under the segment of the value chosen, once it is measured. */
	const fill = $derived(
		fillAt(
			options.map((_, index) => boxes[index]?.[0]?.inlineSize),
			options.findIndex((option) => option.value === value)
		)
	);
</script>

<div
	class="segments"
	class:measured={fill !== undefined}
	role="radiogroup"
	aria-labelledby={labelledby}
	aria-describedby={describedby}
>
	<!-- Created in its place, once the segments are measured: nothing slides when the panel
	     opens. -->
	{#if fill}
		<span class="fill" style:transform="translateX({fill.left}px)" style:width="{fill.width}px"
		></span>
	{/if}
	{#each options as option, index (option.value)}
		<label bind:borderBoxSize={boxes[index]}>
			<input
				type="radio"
				name={group}
				checked={option.value === value}
				onchange={() => onchoose(option.value)}
			/>
			{option.label}
		</label>
	{/each}
</div>

<style>
	.segments {
		position: relative;
		flex: none;
		display: flex;
		padding: var(--space-2);
		border-radius: var(--radius);
		background: var(--chip);
	}

	/* The fill of the value chosen: one element of the group, under its segment and as wide as
	   it. When the value changes, it slides to the segment chosen, fast at first, then settling;
	   a slide turned back starts from where it stands. */
	.fill {
		position: absolute;
		top: var(--space-2);
		bottom: var(--space-2);
		left: var(--space-2);
		border-radius: var(--radius);
		background: var(--chosen);
		transition:
			transform var(--duration-appear) var(--ease-appear),
			width var(--duration-appear) var(--ease-appear);
	}

	/* Over the fill; its text turns with the slide. */
	label {
		position: relative;
		padding: var(--space-4) var(--space-12);
		border-radius: var(--radius);
		color: var(--weak);
		font-weight: var(--weight-control);
		white-space: nowrap;
		cursor: pointer;
		transition: color var(--duration-appear) var(--ease-appear);
	}

	label:has(:checked) {
		color: var(--on-chosen);
	}

	/* Until the browser has measured the segments, the one chosen is filled by itself. */
	.segments:not(.measured) label:has(:checked) {
		background: var(--chosen);
	}

	/* Nothing moves for a learner who asked for less motion. */
	@media (prefers-reduced-motion: reduce) {
		.fill,
		label {
			transition: none;
		}
	}

	/* The button of the browser covers its segment without being drawn: it takes the pointer and
	   the keys, and its segment shows the ring of the focus for it (base.css). */
	input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		appearance: none;
		cursor: inherit;
	}

	input:focus-visible {
		outline: none;
	}

	label:has(:focus-visible) {
		outline: var(--focus-ring);
		outline-offset: var(--focus-offset);
	}
</style>
