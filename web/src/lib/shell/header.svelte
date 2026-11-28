<!-- The header of a screen: one band with the name, then what the screen puts in it (its links or
     its menus, the place of the level), and along its bottom the bar of the progress, on the
     screens that draw it. Under it, the banner of a browser that refuses to save: on every screen
     that has a header, so not on the manual. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LevelsDone } from '#lib/progress/progress.ts';
	import ProgressBar from './progress-bar.svelte';
	import StorageBanner from './storage-banner.svelte';
	import Wordmark from './wordmark.svelte';

	interface Props {
		/** The levels done, and how many there are: the bar of the progress. */
		progress?: LevelsDone;
		children?: Snippet;
	}

	let { progress, children }: Props = $props();
</script>

<header class:with-progress={progress !== undefined}>
	<Wordmark />
	{@render children?.()}
	{#if progress}<ProgressBar done={progress.done} total={progress.total} />{/if}
</header>
<StorageBanner />

<style>
	/* A header without the bar of the progress is 46 pixels high (styles/layout.css), its content
	   centered. The bar gives 3 pixels more, under the content, to the screens that draw it: a
	   level and the home screen; the sandbox never does. The menus open against the bottom of
	   the header (menu-bar.svelte): it is the box they are placed in. */
	header {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		box-sizing: border-box;
		height: var(--header-height);
		padding: 0 var(--space-12);
		background: var(--band);
	}

	.with-progress {
		height: var(--header-height-with-progress);
		padding-bottom: var(--progress-height);
	}
</style>
