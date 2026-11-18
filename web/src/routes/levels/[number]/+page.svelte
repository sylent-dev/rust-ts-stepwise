<!-- The level screen. Its map shows the first map of the level, until its tabs (step 21); until
     the editor (step 16) and the running (step 17), the column of the code holds the bench of the
     animations: short programs played by the core on that map. -->
<script lang="ts">
	import Bench from '#lib/bench/bench.svelte';
	import { Level } from '#lib/core.ts';
	import { coreReady } from '#lib/core-ready.svelte.ts';
	import { t } from '#lib/i18n.ts';
	import { levelMenus } from '#lib/level-menus.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import MapBlock from '#lib/level-screen/map-block.svelte';
	import { titleMessage } from '#lib/levels.ts';
	import type { Playback } from '#lib/playback.svelte.ts';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = $derived(t(titleMessage(data.name)));

	// The map needs the core.
	const core = coreReady();

	/** The level, from the text of its file, kept in the module while its screen is open. */
	const level = $derived(core.ready ? new Level(data.text) : undefined);
	$effect(() => {
		const current = level;
		return () => current?.free();
	});

	/** The goals of the map shown, its first one. */
	const goals = $derived(level?.maps()[0]?.goals);

	/** The program played on the map. */
	let playback = $state.raw<Playback>();
</script>

<svelte:head>
	<title>{t('page-title', { page: t('level-numbered', { number: data.number, title }) })}</title>
</svelte:head>

<LevelScreen>
	{#snippet header()}
		<Header>
			<MenuBar menus={levelMenus('level')} />
			<Place {title} />
			<SettingsButton gear />
		</Header>
	{/snippet}
	{#snippet code()}
		<!-- A bench of its own for each level, whose runs start on its map. -->
		{#if level}
			{#key level}
				<Bench map={data.name} start={(text) => level.start(0, text)} bind:playback />
			{/key}
		{/if}
	{/snippet}
	{#snippet map()}
		<MapBlock
			world={playback?.world}
			{goals}
			motion={playback?.motion}
			progress={playback?.progress}
		/>
	{/snippet}
</LevelScreen>
