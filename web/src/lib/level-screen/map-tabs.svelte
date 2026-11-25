<!-- The tabs of the maps of a level, in the row above its map (see Variants in specs.md): one per
     map, against the left end of the row and without gaps, on its whole height; the tab of the map
     shown opens on the block of the map. A tab takes a pale teal once the code has passed its map,
     a full teal on the map shown, which a screen reader reads as its description. The screen shows
     the row only for a level of more than one map. The tabs are those of a web page, as the ones
     of the panels: Tab stops on the tab shown, the arrows, Home and End go to another one and show
     its map (shell/tab-keys.ts). -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import { mapNumbers } from '#lib/levels/level-maps.ts';
	import { tabAfter } from '#lib/shell/tab-keys.ts';

	interface Props {
		/** The number of maps of the level. */
		count: number;
		/** The number of the map shown, from 1. */
		shown: number;
		/** The maps that the code as it is now has passed, by their numbers. */
		passed: ReadonlySet<number>;
		/** The id of the block of the map, which the tabs show. */
		panel: string;
		/** Shows a map, by its number. */
		onchoose: (map: number) => void;
	}

	let { count, shown, passed, panel, onchoose }: Props = $props();

	const maps = $derived(mapNumbers(count));

	/** The id of the sentence that tells a screen reader that a map has passed, which the teal shows. */
	const passedId = $derived(`${panel}-passed`);

	/** The buttons of the tabs, by the numbers of their maps, which the arrows give the focus to. */
	const buttons: Partial<Record<number, HTMLButtonElement>> = $state({});

	function onkeydown(event: KeyboardEvent) {
		const index = tabAfter(event, shown - 1, count);
		if (index === undefined) return;
		event.preventDefault();
		onchoose(index + 1);
		buttons[index + 1]?.focus();
	}
</script>

<div class="row" role="tablist" aria-label={t('map-tabs-name')}>
	{#each maps as map (map)}
		{@const isShown = map === shown}
		<button
			type="button"
			role="tab"
			class="tab"
			class:is-shown={isShown}
			class:is-passed={passed.has(map)}
			id="{panel}-tab-{map}"
			aria-selected={isShown}
			aria-controls={panel}
			aria-describedby={passed.has(map) ? passedId : undefined}
			tabindex={isShown ? 0 : -1}
			bind:this={buttons[map]}
			{onkeydown}
			onclick={() => {
				if (!isShown) onchoose(map);
			}}>{t('map-tab', { map })}</button
		>
	{/each}
	<span id={passedId} hidden>{t('map-tab-passed')}</span>
</div>

<style>
	/* The row of the tabs, in the tone of the bands, above the block of the map. */
	.row {
		flex: none;
		display: flex;
		align-items: stretch;
		height: var(--map-row-height);
		background: var(--band);
	}

	/* A tab lies against the edges of its row, so it has no corners (see Radii in the design
	   system). */
	.tab {
		padding: 0 var(--space-16);
		border: 0;
		background: none;
		color: var(--weak);
		font-weight: var(--weight-control);
	}

	.tab:hover {
		background: var(--band-hover);
	}

	/* The tab of the map shown opens on its block. */
	.tab.is-shown {
		background: var(--map-block);
		color: var(--text);
		font-weight: var(--weight-strong);
	}

	/* A map that the code has passed: a pale teal, full on the map shown. */
	.tab.is-passed {
		background: var(--passed-soft);
		color: var(--text);
	}

	.tab.is-passed.is-shown {
		background: var(--passed);
		color: var(--on-passed);
	}
</style>
