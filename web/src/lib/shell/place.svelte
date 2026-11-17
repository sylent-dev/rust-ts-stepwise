<!-- The place of the screen, in the middle of its header: the title of the level, or the sandbox
     with its mark. It is the title of the page. The chapter of a level, its number and the bubble of its goal come with the
     list of the levels (step 21). -->
<script lang="ts">
	import Icon, { type IconName } from '#lib/icon.svelte';

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
	/* Centered in the header, on its height without the bar of the progress. */
	.place {
		position: absolute;
		left: 50%;
		top: 4px;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--space-8);
		height: 38px;
		padding: 0 var(--space-12);
		white-space: nowrap;
	}

	.mark {
		color: var(--weak);
	}

	h1 {
		margin: 0;
		font: var(--weight-strong) var(--size-lead) / 18px var(--font-text);
	}
</style>
