<!-- An icon: lines in the color of the text around it, drawn in a square of 16 units. An icon is
     added to the list with the first block that shows it: its name (`icon-name.ts`), then its
     shapes, as the ones of `docs/mockups/interface/icons.js`. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconName } from './icon-name.ts';

	interface Props {
		name: IconName;
		/** Its width and its height, in pixels. */
		size: number;
	}

	let { name, size }: Props = $props();

	/** The shapes of each icon: a name without shapes doesn't compile. */
	const shapes: Record<IconName, Snippet> = {
		'arrow-down': arrowDown,
		'arrow-up': arrowUp,
		check,
		chevron,
		close,
		diamond,
		gear
	};
</script>

{#snippet arrowDown()}
	<path d="M8 2.8v10.4M3.8 9 8 13.2 12.2 9" />
{/snippet}

{#snippet arrowUp()}
	<path d="M8 13.2V2.8M3.8 7 8 2.8 12.2 7" />
{/snippet}

{#snippet check()}
	<path d="m3 8.5 3.2 3.2L13 4.8" />
{/snippet}

{#snippet chevron()}
	<path d="m6 3.5 4.5 4.5L6 12.5" />
{/snippet}

{#snippet close()}
	<path d="m4 4 8 8M12 4l-8 8" />
{/snippet}

{#snippet diamond()}
	<path d="M8 2.2 13.8 8 8 13.8 2.2 8Z" />
{/snippet}

<!-- Thinner lines than the others: its teeth are close to each other. -->
{#snippet gear()}
	<path
		stroke-width="1.4"
		d="M6.24 3.32 L6.63 1.24 L9.37 1.24 L9.76 3.32 L10.06 3.45 L11.81 2.25 L13.75 4.19 L12.55 5.94 L12.68 6.24 L14.76 6.63 L14.76 9.37 L12.68 9.76 L12.55 10.06 L13.75 11.81 L11.81 13.75 L10.06 12.55 L9.76 12.68 L9.37 14.76 L6.63 14.76 L6.24 12.68 L5.94 12.55 L4.19 13.75 L2.25 11.81 L3.45 10.06 L3.32 9.76 L1.24 9.37 L1.24 6.63 L3.32 6.24 L3.45 5.94 L2.25 4.19 L4.19 2.25 L5.94 3.45 Z"
	/>
	<circle cx="8" cy="8" r="2" stroke-width="1.4" />
{/snippet}

<svg
	width={size}
	height={size}
	viewBox="0 0 16 16"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{@render shapes[name]()}
</svg>

<style>
	svg {
		display: block;
	}
</style>
