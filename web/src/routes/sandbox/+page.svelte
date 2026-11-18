<!-- The sandbox: the level screen without goal. Until the map view (step 14) and the running
     (step 17) replace it, its screen is the probe of step 4: a program run by the core on the
     map of the sandbox. -->
<script lang="ts">
	import { loadCore } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import { levelMenus } from '#lib/level-menus.ts';
	import Probe from '#lib/probe.svelte';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';

	const core = loadCore();
</script>

<svelte:head>
	<title>{t('page-title', { page: t('sandbox') })}</title>
</svelte:head>

<Header>
	<MenuBar menus={levelMenus('sandbox')} />
	<Place title={t('sandbox')} icon="diamond" />
	<SettingsButton gear />
</Header>
<main>
	{#await core then}
		<Probe />
	{:catch}
		<p role="alert">{t('core-load-failed')}</p>
	{/await}
</main>

<style>
	main {
		padding: var(--space-24);
		overflow: auto;
		background: var(--surface);
	}
</style>
