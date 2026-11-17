<!-- A link of a band, such as the header: a text without a box, filled under the pointer. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';

	interface Props {
		/** The page it leads to, as its address from the root of the website: `sandbox`. */
		to: Path;
		children: Snippet;
	}

	let { to, children }: Props = $props();
</script>

<a href={resolve(to)}>{@render children()}</a>

<style>
	a {
		display: flex;
		align-items: center;
		height: 30px;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		color: var(--text);
		font-weight: var(--weight-control);
		line-height: 1;
		text-decoration: none;
		white-space: nowrap;
	}

	a:hover {
		background: var(--band-hover);
	}
</style>
