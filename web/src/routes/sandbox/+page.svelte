<!-- The sandbox: the level screen without goal. Until the editor (step 16) and the running
     (step 17) replace it, the column of the code holds the probe of step 4: a program run by the
     core on the map of the sandbox, shown on the map of the screen. -->
<script lang="ts">
	import { loadCore, type World } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import { levelMenus } from '#lib/level-menus.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import MapBlock from '#lib/level-screen/map-block.svelte';
	import Probe from '#lib/probe.svelte';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';
	import { loadFailed } from '#lib/startup.ts';

	// The probe needs the core. A core that can't load: the page itself says so, in place of
	// the screen.
	let ready = $state(false);
	loadCore().then(() => (ready = true), loadFailed);

	/** The world of the program of the probe, as its last step left it. */
	let world = $state.raw<World>();
</script>

<svelte:head>
	<title>{t('page-title', { page: t('sandbox') })}</title>
</svelte:head>

<LevelScreen>
	{#snippet header()}
		<Header>
			<MenuBar menus={levelMenus('sandbox')} />
			<Place title={t('sandbox')} icon="diamond" />
			<SettingsButton gear />
		</Header>
	{/snippet}
	{#snippet code()}
		{#if ready}
			<Probe bind:world />
		{/if}
	{/snippet}
	{#snippet map()}
		<MapBlock {world} />
	{/snippet}
</LevelScreen>
