<!-- What opens the settings from a header (see Settings in specs.md): their name among the
     links of the home screen, a gear at the right end of the header of a level. It stays lit
     while its panel is open. -->
<script lang="ts">
	import Icon from '#lib/icon.svelte';
	import { t } from '#lib/i18n.ts';
	import SettingsPanel from './settings-panel.svelte';

	/** `gear`: drawn as a gear rather than written. */
	let { gear = false }: { gear?: boolean } = $props();

	let open = $state(false);
</script>

<button
	type="button"
	class="band-item"
	class:gear
	title={gear ? t('settings') : undefined}
	aria-label={gear ? t('settings') : undefined}
	aria-haspopup="dialog"
	aria-expanded={open}
	onclick={() => (open = true)}
>
	{#if gear}<Icon name="gear" size={18} />{:else}{t('settings')}{/if}
</button>
<SettingsPanel bind:open />

<style>
	/* The gear: a square as high as the names of the menus, weaker than them until the pointer
	   is over it or its panel open. */
	.gear {
		justify-content: center;
		width: 30px;
		margin-left: auto;
		padding: 0;
		color: var(--weak);
	}

	.gear:hover,
	.gear[aria-expanded='true'] {
		color: var(--text);
	}
</style>
