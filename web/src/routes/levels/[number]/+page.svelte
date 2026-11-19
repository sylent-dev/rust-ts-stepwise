<!-- The level screen of a level: the page loads its file, the core reads it, and the screen plays
     on its first map, until the tabs of the maps (step 21). -->
<script lang="ts">
	import { Level } from '#lib/core.ts';
	import { fromCore } from '#lib/core-ready.svelte.ts';
	import { t } from '#lib/i18n.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import { levelPlayground } from '#lib/level-screen/playground.ts';
	import { titleMessage } from '#lib/levels.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = $derived(t(titleMessage(data.name)));

	/** The level, from the text of its file, kept in the module while its screen is open. */
	const level = fromCore(() => new Level(data.text));

	/** The map shown, its first one. */
	const playground = $derived(level.current && levelPlayground(data.name, level.current, 0));
</script>

<svelte:head>
	<title>{t('page-title', { page: t('level-numbered', { number: data.number, title }) })}</title>
</svelte:head>

<LevelScreen screen="level" {title} {playground} />
