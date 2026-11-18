<!-- The message of a window too small for a screen (see Error handling in specs.md): it says
     the size it needs and the size it has, which follows the window, or asks for a computer
     under the width of a phone. -->
<script lang="ts">
	import { t, tAround } from '#lib/i18n.ts';
	import { isApple } from '#lib/platform.ts';
	import { currentWindow } from './current-window.svelte.ts';
	import ScreenMessage from './screen-message.svelte';
	import { SMALLEST_WINDOW } from './window-size.ts';

	/** A size as a message writes it: `1280 × 720`. */
	function size(width: number, height: number): string {
		return t('window-size', { width: String(width), height: String(height) });
	}

	// The size of the window is drawn in bold, inside its sentence.
	const [before, after] = tAround('window-small-size', 'size', {
		least: size(SMALLEST_WINDOW.width, SMALLEST_WINDOW.height)
	});
	const platform = isApple(navigator.platform) ? 'mac' : 'other';
</script>

{#if currentWindow.fit === 'phone'}
	<ScreenMessage title={t('window-phone-title')} phone>
		<p>{t('window-phone-text')}</p>
	</ScreenMessage>
{:else}
	<ScreenMessage title={t('window-small-title')}>
		<p>{before}<b>{size(currentWindow.width, currentWindow.height)}</b>{after}</p>
		<p>{t('window-small-zoom', { platform })}</p>
	</ScreenMessage>
{/if}
