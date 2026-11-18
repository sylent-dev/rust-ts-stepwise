<!-- A choice between a few values side by side, the one chosen filled with the color of the
     text: the theme in the settings. They are the radio buttons of the browser, drawn as
     segments: Tab stops once on the group, the arrows go from a value to the next and choose
     it, as the pointer does. -->
<script lang="ts" generics="Value extends string">
	interface Props {
		/** The `id` of the text that names the choice. */
		labelledby: string;
		/** The values, from left to right, each with its text. */
		options: readonly { value: Value; label: string }[];
		/** The value chosen. */
		value: Value;
		onchoose: (value: Value) => void;
	}

	let { labelledby, options, value, onchoose }: Props = $props();

	/** What makes one group of the radio buttons. */
	const group = $props.id();
</script>

<div class="segments" role="radiogroup" aria-labelledby={labelledby}>
	{#each options as option (option.value)}
		<label>
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
		flex: none;
		display: flex;
		padding: var(--space-2);
		border-radius: var(--radius);
		background: var(--chip);
	}

	label {
		position: relative;
		padding: var(--space-4) var(--space-12);
		border-radius: var(--radius);
		color: var(--weak);
		font-weight: var(--weight-control);
		white-space: nowrap;
		cursor: pointer;
	}

	label:has(:checked) {
		background: var(--chosen);
		color: var(--on-chosen);
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
