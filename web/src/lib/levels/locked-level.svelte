<!-- The message in place of a level still locked, opened by its address (see Error handling in
     specs.md): it names the level to play, and leads to the home screen. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n.ts';
	import ScreenMessage from '#lib/shell/screen-message.svelte';

	interface Props {
		/** The level to play, as a sentence names it: `3. The long way`. */
		toPlay: string;
	}

	let { toPlay }: Props = $props();
</script>

<ScreenMessage title={t('locked-title')}>
	<p>{t('locked-text', { level: toPlay })}</p>
	<a class="button is-main screen-message-action" href={resolve('')}>{t('screen-home')}</a>
</ScreenMessage>
