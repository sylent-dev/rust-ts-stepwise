<!-- The place of the screen, in its header above the crossing of its two columns: the chapter of
     the level in small capitals above its title, or the sandbox with its mark. The title is the
     title of the page. The number of a level stands in an amber circle on the crossing of the
     header and the two columns, beside the place rather than in it: the place keeps its own
     stacking order (its `transform`), under which the circle couldn't take its layer. The bubble
     of the goal, which both will open, comes with step 21c. -->
<script lang="ts">
	import type { IconName } from '#lib/icon-name.ts';
	import Icon from '#lib/icon.svelte';

	interface Props {
		title: string;
		/** The chapter of a level, above its title. */
		chapter?: string;
		/** The number of a level, in its circle. */
		number?: number;
		/** The mark before the title: the diamond of the sandbox. */
		icon?: IconName;
	}

	let { title, chapter, number, icon }: Props = $props();
</script>

{#if number !== undefined}<div class="number">{number}</div>{/if}
<div class="place" class:with-chapter={chapter !== undefined}>
	{#if icon}<span class="mark"><Icon name={icon} size={14} /></span>{/if}
	{#if chapter !== undefined}<span class="chapter">{chapter}</span>{/if}
	<h1>{title}</h1>
</div>

<style>
	/* Centered on the crossing of the two columns of its screen (level-screen/level-screen.svelte),
	   the middle of the window until the code stops growing. It keeps 4 pixels above it and under
	   it in the header without the bar of the progress: 38 pixels, the room for the chapter over
	   the title of a level, which the bar leaves as it is, under them. */
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

	.with-chapter {
		flex-direction: column;
		justify-content: center;
		gap: 0;
	}

	.mark {
		color: var(--weak);
	}

	/* The chapter in small capitals, on a line of 13 pixels, and the title on a line of 18: in
	   whole pixels rather than line heights of the scale, the two lines fit in the place, as the
	   mock-up draws them. */
	.chapter {
		color: var(--weak);
		font-size: var(--size-label);
		font-weight: var(--weight-strong);
		line-height: 13px;
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font: var(--weight-strong) var(--size-lead) / 18px var(--font-text);
	}

	/* The circle of the number, its middle 3 pixels under the bottom of the header, so that it
	   clears the title, which stays centered: over the code and the map, which meet under it. Its
	   side, as the mock-up draws it. */
	.number {
		position: absolute;
		z-index: var(--layer-level-number);
		left: var(--crossing, 50%);
		top: calc(100% + var(--progress-height));
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
		font: var(--weight-strong) var(--size-text) var(--font-name);
	}
</style>
