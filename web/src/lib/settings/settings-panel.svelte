<!-- The panel of the settings (see Settings in specs.md): a row per setting, its name and its
     sentence on the left, its control on the right. A change applies at once and is saved. A
     row arrives with the step that codes its setting: **Sounds** with the sounds (step 18),
     **Clear all progress** with the levels (step 21). -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import Panel from '#lib/shell/panel.svelte';
	import { chooseTheme, settings } from './current-settings.svelte.ts';
	import Segments from './segments.svelte';
	import { themeMessage, THEMES } from './settings.ts';

	let { open = $bindable() }: { open: boolean } = $props();

	const id = $props.id();

	const themes = THEMES.map((theme) => ({ value: theme, label: t(themeMessage(theme)) }));
</script>

<Panel title={t('settings-title')} bind:open width={500}>
	<div class="rows">
		<div class="row">
			<div>
				<b id="{id}-theme">{t('settings-theme')}</b>
				<p id="{id}-theme-note">{t('settings-theme-note')}</p>
			</div>
			<Segments
				labelledby="{id}-theme"
				describedby="{id}-theme-note"
				options={themes}
				value={settings.theme}
				onchoose={chooseTheme}
			/>
		</div>
	</div>
</Panel>

<style>
	/* Under the title of the panel; each row has its own room above and under it. */
	.rows {
		margin-top: var(--space-8);
		padding-bottom: var(--space-8);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-24);
		padding: var(--space-16) 0;
		border-top: 1px solid var(--hover);
	}

	b {
		font-weight: var(--weight-strong);
	}

	p {
		margin: var(--space-2) 0 0;
		color: var(--weak);
	}
</style>
