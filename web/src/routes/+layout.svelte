<!-- What every page shares: the design tokens, the fonts, the base styles and the look of what
     is clicked in a band; and the settings, which the page follows. -->
<script lang="ts">
	import '#lib/styles/tokens.css';
	import '#lib/styles/fonts.css';
	import '#lib/styles/base.css';
	import '#lib/styles/band.css';
	import { followSavedSettings, settings } from '#lib/settings/current-settings.svelte.ts';
	import { SETTINGS_KEY } from '#lib/settings/saved-settings.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// The theme of the settings is the one of the page. The script of app.html gave the page the
	// theme saved before its first paint; from then on, a change applies at once.
	$effect(() => {
		document.documentElement.dataset.theme = settings.theme;
	});

	/**
	 * Another tab where Stepwise is open has saved something: a change of the settings applies
	 * here too, at once. Without a key, everything saved was cleared.
	 */
	function onstorage(event: StorageEvent) {
		if (event.key === null || event.key === SETTINGS_KEY) followSavedSettings();
	}
</script>

<svelte:window {onstorage} />

{@render children()}
