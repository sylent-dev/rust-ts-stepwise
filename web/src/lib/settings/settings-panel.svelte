<!-- The panel of the settings (see Settings in specs.md): a row per setting, its name and its
     sentence on the left, its control on the right. A change applies at once and is saved; the
     sounds turned on play the sound of a success once, so that the learner hears at once that
     they work, and how loud. A row arrives with the step that codes its setting: **Clear all
     progress** with the levels (step 21). -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import Panel from '#lib/shell/panel.svelte';
	import { pageSounds } from '#lib/sounds/page-sounds.ts';
	import { chooseSounds, chooseTheme, settings } from './current-settings.svelte.ts';
	import Segments from './segments.svelte';
	import { SOUNDS, soundsMessage, themeMessage, THEMES, type SoundsValue } from './settings.ts';

	let { open = $bindable() }: { open: boolean } = $props();

	const id = $props.id();

	const themes = THEMES.map((theme) => ({ value: theme, label: t(themeMessage(theme)) }));

	const sounds = SOUNDS.map((value) => ({ value, label: t(soundsMessage(value)) }));

	/** Turns the sounds on or off; on, the sound of a success plays once, in this tab alone. */
	function chooseSoundsValue(value: SoundsValue) {
		chooseSounds(value === 'on');
		if (value === 'on') pageSounds.play('success');
	}
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
		<div class="row">
			<b id="{id}-sounds">{t('settings-sounds')}</b>
			<Segments
				labelledby="{id}-sounds"
				options={sounds}
				value={settings.sounds ? 'on' : 'off'}
				onchoose={chooseSoundsValue}
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
