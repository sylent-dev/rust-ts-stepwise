<!-- The header of a screen: one band with the name, then what the screen puts in it (its links or
     its menus, the place of the level). -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Wordmark from './wordmark.svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<header>
	<Wordmark />
	{@render children?.()}
</header>

<style>
	/* The content is centered on the height above the last 3 pixels, those of the bar of the
	   progress (step 21). */
	header {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		box-sizing: border-box;
		height: 49px;
		padding: 0 var(--space-12) 3px;
		background: var(--band);
	}
</style>
