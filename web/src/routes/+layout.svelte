<!-- What every page shares: the design tokens, the fonts, the base styles, the look of what is
     clicked in a band and of a message in place of the screen; the settings, which the page
     follows; and the message of a window too small, which takes the place of any screen. -->
<script lang="ts">
	import '#lib/styles/tokens.css';
	import '#lib/styles/fonts.css';
	import '#lib/styles/base.css';
	import '#lib/styles/band.css';
	import '#lib/styles/screen-message.css';
	import { onMount } from 'svelte';
	import { followSavedSettings, settings } from '#lib/settings/current-settings.svelte.ts';
	import { SETTINGS_KEY } from '#lib/settings/saved-settings.ts';
	import { currentWindow } from '#lib/shell/current-window.svelte.ts';
	import WindowMessage from '#lib/shell/window-message.svelte';
	import { applicationStarted } from '#lib/page/startup.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// The page watched the application start (src/app.html): it runs.
	onMount(applicationStarted);

	const fits = $derived(currentWindow.fit === 'screen');

	/** What had the focus of the keyboard when the screen went away. */
	let held: Element | null = null;

	// The screen comes back as it was, the focus too. It is read before the page changes: once
	// the screen is out of reach, the browser has already taken the focus away.
	$effect.pre(() => {
		if (!fits) held = document.activeElement;
	});
	$effect(() => {
		if (!fits || !(held instanceof HTMLElement)) return;
		held.focus({ preventScroll: true });
		held = null;
	});

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

<!-- Under the message of a window too small, the screen stays in the page as it was, out of
     sight and out of reach: it comes back with its state once the window is large enough. -->
<div class="screen" class:is-away={!fits} inert={!fits}>
	{@render children()}
</div>
{#if !fits}
	<WindowMessage />
{/if}

<style>
	/* The screen has no box of its own: the body lays out what it holds (styles/base.css). Out
	   of sight, it keeps its layout, and so what it scrolled to. */
	.screen {
		display: contents;
	}

	.is-away {
		visibility: hidden;
	}
</style>
