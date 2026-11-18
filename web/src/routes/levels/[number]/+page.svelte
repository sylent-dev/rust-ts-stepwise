<!-- The level screen. Its map shows the first map of the level, until its tabs (step 21); the
     editor (step 16) and the running (step 17) come next. -->
<script lang="ts">
	import { Level, loadCore, type LevelMap } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import { levelMenus } from '#lib/level-menus.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import MapBlock from '#lib/level-screen/map-block.svelte';
	import { titleMessage } from '#lib/levels.ts';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';
	import { loadFailed } from '#lib/startup.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = $derived(t(titleMessage(data.name)));

	// The map needs the core. A core that can't load: the page itself says so, in place of the
	// screen.
	let ready = $state(false);
	loadCore().then(() => (ready = true), loadFailed);

	/**
	 * The first map of a level, from the text of its file: the core reads it, and is done with
	 * it at once.
	 */
	function firstMap(text: string): LevelMap | undefined {
		const level = new Level(text);
		try {
			return level.maps()[0];
		} finally {
			level.free();
		}
	}

	const shown = $derived(ready ? firstMap(data.text) : undefined);
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
	{#snippet map()}
		<MapBlock world={shown?.world} goals={shown?.goals} />
	{/snippet}
</LevelScreen>
