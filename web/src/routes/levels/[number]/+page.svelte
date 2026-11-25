<!-- The level screen of a level: the page loads its file, the core reads it, and the screen plays
     on the map that the address shows, `/levels/18?map=2`, its first map without a parameter (see
     Variants in specs.md). A tab of a map changes the address without a new entry in the history
     of the browser, nor loading the page again: SvelteKit keeps that address in `page.shallow`, so
     the address alone says which map is shown. An address with a map that the level doesn't have
     shows its first map, and loses that parameter. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Level } from '#lib/core/core.ts';
	import { fromCore } from '#lib/core/core-ready.svelte.ts';
	import { t } from '#lib/i18n.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import { levelPlayground } from '#lib/level-screen/playground.ts';
	import { mapAt, mapQuery } from '#lib/levels/level-maps.ts';
	import { levelMessage } from '#lib/levels/levels.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = $derived(t(levelMessage(data.name, 'title')));

	/** The level, from the text of its file, kept in the module while its screen is open. */
	const level = fromCore(() => new Level(data.text));

	/** The number of maps of the level; none until the core has read it. */
	const count = $derived(level.current?.maps().length ?? 0);

	/** The address of the screen, as the tabs of the maps last changed it. */
	const address = $derived(page.shallow?.url ?? page.url);

	/** The number of the map shown, from 1. */
	const shown = $derived(mapAt(address, count));

	/** The map shown. */
	const playground = $derived(
		level.current && levelPlayground(data.name, level.current, shown - 1)
	);

	/** Shows a map in place of the address, without a new entry in the history of the browser. */
	function show(map: number) {
		void goto(resolve(`levels/${String(data.number)}${mapQuery(map)}`), {
			shallow: true,
			replace: true
		});
	}

	// An address that asks a map the level doesn't have, or the first map by its parameter, says
	// the map shown once the core has read the level.
	$effect(() => {
		if (count > 0 && address.search !== mapQuery(shown)) show(shown);
	});
</script>

<svelte:head>
	<title>{t('tab-title', { page: t('screen-level', { number: data.number, title }) })}</title>
</svelte:head>

<LevelScreen
	screen="level"
	number={data.number}
	{title}
	{playground}
	onchoosemap={(map: number) => {
		show(map);
	}}
/>
