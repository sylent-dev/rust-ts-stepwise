<!-- What every page shares: the design tokens, the fonts, the base styles and the look of what
     is clicked in a band. -->
<script lang="ts">
	import '#lib/styles/tokens.css';
	import '#lib/styles/fonts.css';
	import '#lib/styles/base.css';
	import '#lib/styles/band.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
