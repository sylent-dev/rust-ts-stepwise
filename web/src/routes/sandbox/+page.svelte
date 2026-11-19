<!-- The sandbox: the level screen without goal. Until the editor (step 16) and the running
     (step 17) replace it, the column of the code holds the bench of the animations: short
     programs played by the core on the map of the sandbox. -->
<script lang="ts">
	import sandboxFile from '../../../levels/sandbox.toml?raw';
	import Bench from '#lib/bench/bench.svelte';
	import { Sandbox } from '#lib/core.ts';
	import { coreReady } from '#lib/core-ready.svelte.ts';
	import { t } from '#lib/i18n.ts';
	import { levelMenus } from '#lib/level-menus.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import MapBlock from '#lib/level-screen/map-block.svelte';
	import type { Playback } from '#lib/playback.svelte.ts';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';

	// The map needs the core.
	const core = coreReady();

	/** The sandbox, kept in the module while its screen is open. */
	const sandbox = $derived(core.ready ? new Sandbox(sandboxFile) : undefined);
	$effect(() => {
		const current = sandbox;
		return () => current?.free();
	});

	/** The program played on the map. */
	let playback = $state.raw<Playback>();
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
		{#if sandbox}
			<Bench map="sandbox" start={(text) => sandbox.start(text)} bind:playback />
		{/if}
	{/snippet}
	{#snippet map()}
		<MapBlock
			world={playback?.world}
			motion={playback?.motion}
			progress={playback?.progress}
			outcome={playback?.outcome}
		/>
	{/snippet}
</LevelScreen>
