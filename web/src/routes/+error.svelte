<!-- The page of an address that leads to no screen, mistyped or of a level after the last (see
     Error handling in specs.md): a message, and the way back to the home screen. For any other
     error, one that the application didn't foresee, the page itself shows its message of a file
     that couldn't load: loading the page again is what can be tried. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { t } from '#lib/i18n.ts';
	import { loadFailed } from '#lib/page/startup.svelte.ts';
	import ScreenMessage from '#lib/shell/screen-message.svelte';

	const missing = $derived(page.status === 404);

	$effect(() => {
		if (!missing) loadFailed();
	});
</script>

<svelte:head>
	<title>{missing ? t('tab-title', { page: t('missing-title') }) : t('app-name')}</title>
</svelte:head>

{#if missing}
	<ScreenMessage title={t('missing-title')} mark={t('missing-mark')}>
		<p>{t('missing-text')}</p>
		<a class="screen-message-action" href={resolve('')}>{t('screen-home')}</a>
	</ScreenMessage>
{/if}
