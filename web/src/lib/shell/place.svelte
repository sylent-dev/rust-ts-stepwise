<!-- The place of the screen, in its header above the crossing of its two columns: the title of the
     level, or the sandbox with its mark. It is the title of the page. The chapter of a level, its
     number and the bubble of its goal come with the list of the levels (step 21). -->
<script lang="ts">
	import type { IconName } from '#lib/icon-name.ts';
	import Icon from '#lib/icon.svelte';

	interface Props {
		title: string;
		/** The mark before the title: the diamond of the sandbox. */
		icon?: IconName;
	}

	let { title, icon }: Props = $props();
</script>

<div class="place">
	{#if icon}<span class="mark"><Icon name={icon} size={14} /></span>{/if}
	<h1>{title}</h1>
</div>

<style>
	/* Centered on the crossing of the two columns of its screen (level-screen/level-screen.svelte),
	   the middle of the window until the code stops growing. It keeps 4 pixels above it and under
	   it in the header without the bar of the progress: 38 pixels, the room for the chapter over
	   the title of a level (step 21). */
	.place {
		position: absolute;
		left: var(--crossing, 50%);
		top: var(--space-4);
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--space-8);
		height: calc(var(--header-height) - 2 * var(--space-4));
		padding: 0 var(--space-12);
		white-space: nowrap;
	}

	.mark {
		color: var(--weak);
	}

	/* A line of 18 pixels, in whole pixels rather than a line height of the scale: with the 13
	   pixels of the chapter over it (step 21), the two lines fit in the place, as the mock-up
	   draws them. */
	h1 {
		margin: 0;
		font: var(--weight-strong) var(--size-lead) / 18px var(--font-text);
	}
</style>
