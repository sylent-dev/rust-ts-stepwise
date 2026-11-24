<!-- The panels under the map (see Level screen, Console and Variables panel in specs.md): the
     console and the variables, two tabs in a window narrower than 1,600 pixels, which follow the
     program (panel-tabs.svelte.ts), a dot on the tab of the variables after an error; from there,
     side by side, each under its title, without a dot, both being in sight. The tabs are those of a
     web page: Tab stops on the tab shown, the arrows, Home and End go to the other one and show it,
     and Tab goes on into its panel. A panel hidden keeps its place and where it was scrolled to, so
     that the console shows its last lines again as it comes back. -->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import type { LogView } from '#lib/console/console-log.svelte.ts';
	import ConsolePanel from '#lib/console/console-panel.svelte';
	import { t } from '#lib/i18n.ts';
	import type { CallsView } from '#lib/run/shown-calls.svelte.ts';
	import VariablesPanel from '#lib/variables/variables-panel.svelte';
	import type { PanelName, PanelTabs } from './panel-tabs.svelte.ts';

	interface Props {
		/** Which panel the tabs show. */
		tabs: PanelTabs;
		/** The log of the program shown; nothing while the screen has no program. */
		log: LogView | undefined;
		/** The calls of the program shown; nothing while the screen has no program. */
		calls: CallsView | undefined;
		/** Puts the cursor at a place of the code, that of an error clicked in the console. */
		onshow: (at: number) => void;
		/** Shows the variables of a call in progress, which the learner clicked. */
		onchoose: (index: number) => void;
	}

	let { tabs, log, calls, onshow, onchoose }: Props = $props();

	/** The panels, in the order of their tabs. */
	const PANELS: readonly PanelName[] = ['console', 'variables'];

	/** The name of each panel, on its tab or its title. */
	const names = {
		console: t('console-name'),
		variables: t('variables-name')
	} satisfies Record<PanelName, string>;

	/** From 1,600 pixels wide, the two panels stand side by side. */
	const side = new MediaQuery('min-width: 1600px');

	const id = $props.id();
	const nameId = (panel: PanelName) => `${id}-${panel}-name`;
	const panelId = (panel: PanelName) => `${id}-${panel}`;
	const dotId = `${id}-dot`;

	/** The buttons of the tabs, which the arrows give the focus to. */
	const buttons: Partial<Record<PanelName, HTMLButtonElement>> = $state({});

	/** The tab that a key goes to from the one shown: nothing for another key. */
	function tabAfter(key: string): PanelName | undefined {
		const index = PANELS.indexOf(tabs.shown);
		switch (key) {
			case 'ArrowLeft':
				return PANELS.at((index - 1) % PANELS.length);
			case 'ArrowRight':
				return PANELS.at((index + 1) % PANELS.length);
			case 'Home':
				return PANELS.at(0);
			case 'End':
				return PANELS.at(-1);
			default:
				return undefined;
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const panel = tabAfter(event.key);
		if (!panel) return;
		event.preventDefault();
		tabs.choose(panel);
		buttons[panel]?.focus();
	}

	/** Whether `panel` is hidden behind the other tab. */
	const hidden = (panel: PanelName) => !side.current && tabs.shown !== panel;

	/** The name and the role of the block of `panel`: a panel of its tab, or a region. */
	const panelAttributes = (panel: PanelName) => ({
		id: panelId(panel),
		role: side.current ? 'region' : 'tabpanel',
		'aria-labelledby': nameId(panel)
	});
</script>

<div class="panels" class:side={side.current}>
	{#if side.current}
		{#each PANELS as panel (panel)}
			<h2 class="title" id={nameId(panel)}>{names[panel]}</h2>
		{/each}
	{:else}
		<div class="tabs" role="tablist" aria-label={t('panels-name')} tabindex="-1" {onkeydown}>
			{#each PANELS as panel (panel)}
				{@const shown = tabs.shown === panel}
				{@const dot = panel === 'variables' && tabs.dot}
				<button
					type="button"
					role="tab"
					class="tab"
					class:is-shown={shown}
					class:has-dot={dot}
					id={nameId(panel)}
					aria-selected={shown}
					aria-controls={panelId(panel)}
					aria-describedby={dot ? dotId : undefined}
					tabindex={shown ? 0 : -1}
					bind:this={buttons[panel]}
					onclick={() => {
						tabs.choose(panel);
					}}>{names[panel]}</button
				>
			{/each}
			<span id={dotId} hidden>{t('variables-dot')}</span>
		</div>
	{/if}
	<div class="place console" class:is-hidden={hidden('console')}>
		<ConsolePanel {log} {onshow} {...panelAttributes('console')} />
	</div>
	<div class="place variables" class:is-hidden={hidden('variables')}>
		<VariablesPanel {calls} {onchoose} {...panelAttributes('variables')} />
	</div>
</div>

<style>
	/* The tabs above the panel shown, both panels in the same place; from 1,600 pixels wide, two
	   columns, each panel under its title. */
	.panels {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto minmax(0, 1fr);
		height: 100%;
	}

	.panels.side {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.place {
		grid-row: 2;
		grid-column: 1;
		min-width: 0;
		min-height: 0;
	}

	.side .variables {
		grid-column: 2;
	}

	/* Hidden behind the other tab, it keeps its box, and where it was scrolled to. */
	.place.is-hidden {
		visibility: hidden;
	}

	/* The first tab, and each title, starts where the text of its panel does. */
	.tabs {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-16);
	}

	.tab {
		position: relative;
		padding: var(--space-4) var(--space-12);
		border: 0;
		border-radius: var(--radius);
		background: none;
		color: var(--weak);
		font-weight: var(--weight-control);
	}

	.tab.is-shown {
		background: var(--chosen-soft);
		color: var(--text);
	}

	/* The dot of the state at an error: 6 pixels, in its corner, as in the mock-up. */
	.tab.has-dot::after {
		content: '';
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--error);
	}

	.title {
		margin: 0;
		padding: var(--space-8) var(--space-16) var(--space-6);
		color: var(--text);
		font-size: var(--size-text);
		font-weight: var(--weight-control);
	}
</style>
