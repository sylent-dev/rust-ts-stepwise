<!-- The header of a screen: one band with the name, then what the screen puts in it (its links or
     its menus, the place of the level). Under it, the banner of a browser that refuses to save:
     on every screen that has a header, so not on the manual. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import StorageBanner from './storage-banner.svelte';
	import Wordmark from './wordmark.svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<header>
	<Wordmark />
	{@render children?.()}
</header>
<StorageBanner />

<style>
	/* A header without the bar of the progress is 46 pixels high, its content centered. The bar
	   (step 21) gives 3 pixels more, under the content, to the screens that draw it; the sandbox
	   never does. The menus open against the bottom of the header (menu-bar.svelte): it is the
	   box they are placed in. */
	header {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		box-sizing: border-box;
		height: 46px;
		padding: 0 var(--space-12);
		background: var(--band);
	}
</style>
