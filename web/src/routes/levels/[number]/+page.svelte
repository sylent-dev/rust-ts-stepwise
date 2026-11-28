<!-- The level screen of a level: the page loads its file, the core reads it, and the screen plays
     on the map that the address shows, `/levels/18?map=2`, its first map without a parameter (see
     Variants in specs.md). A tab of a map changes the address without a new entry in the history
     of the browser, nor loading the page again: SvelteKit keeps that address in `page.shallow`, so
     the address alone says which map is shown. An address with a map that the level doesn't have
     shows its first map, and loses that parameter. A level still locked shows a message in its
     place, until it opens (see Error handling in specs.md). -->
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
	import { chapterMessage, levelMessage } from '#lib/levels/levels.ts';
	import LockedLevel from '#lib/levels/locked-level.svelte';
	import { currentProgress } from '#lib/progress/current-progress.svelte.ts';
	import { isOpen, levelsDone, levelToPlay } from '#lib/progress/progress.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** The level of the address. */
	const shownLevel = $derived(data.level);

	/** The stable names of the levels, in their order. */
	const names = $derived(data.levels.map(({ name }) => name));

	const title = $derived(t(levelMessage(shownLevel.name, 'title')));

	/** Whether the level is open; a level still locked shows a message in its place. */
	const open = $derived(isOpen(currentProgress(), names, shownLevel.number));

	/**
	 * The level to play, as a sentence names it (`3. The long way`), which the message of a level
	 * still locked names: there is one, since the first level is always open.
	 */
	const toPlay = $derived.by(() => {
		const number = levelToPlay(currentProgress(), names, shownLevel.number);
		const level = number === undefined ? undefined : data.levels[number - 1];
		return (
			level &&
			t('screen-level', { number: level.number, title: t(levelMessage(level.name, 'title')) })
		);
	});

	/** The levels done, which the bar of the progress shows. */
	const progress = $derived(levelsDone(currentProgress(), names));

	/**
	 * The level before the one shown and the level after it, by their numbers, while they are open:
	 * **Previous level** and **Next level** lead there.
	 */
	const beside = $derived({
		previous: openNumber(shownLevel.number - 1),
		next: openNumber(shownLevel.number + 1)
	});

	/** `number`, when it is the number of a level that is open. */
	function openNumber(number: number): number | undefined {
		return isOpen(currentProgress(), names, number) ? number : undefined;
	}

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
		level.current && levelPlayground(shownLevel.name, level.current, shown - 1)
	);

	/** Shows a map in place of the address, without a new entry in the history of the browser. */
	function show(map: number) {
		void goto(resolve(`levels/${String(shownLevel.number)}${mapQuery(map)}`), {
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
	<title>
		{t('tab-title', {
			page: open ? t('screen-level', { number: shownLevel.number, title }) : t('locked-title')
		})}
	</title>
</svelte:head>

{#if open}
	<LevelScreen
		screen="level"
		number={shownLevel.number}
		{title}
		chapter={t(chapterMessage(shownLevel.chapter, 'title'))}
		{progress}
		{beside}
		{playground}
		onchoosemap={(map: number) => {
			show(map);
		}}
	/>
{:else if toPlay}
	<LockedLevel {toPlay} />
{/if}
