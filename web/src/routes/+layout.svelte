<!-- What every page shares: the design tokens, the fonts and the base styles. -->
<script lang="ts">
	import '#lib/styles/tokens.css';
	import '#lib/styles/fonts.css';
	import '#lib/styles/base.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
