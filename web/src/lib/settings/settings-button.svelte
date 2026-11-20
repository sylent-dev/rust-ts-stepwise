<!-- What opens the settings from a header (see Settings in specs.md): their name among the
     links of the home screen, a gear at the right end of the header of a level. It stays lit
     while its panel is open. -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import IconButton from '#lib/shell/icon-button.svelte';
	import SettingsPanel from './settings-panel.svelte';

	/** `gear`: drawn as a gear rather than written. */
	let { gear = false }: { gear?: boolean } = $props();

	let open = $state(false);
</script>

{#if gear}
	<div class="end">
		<IconButton
			icon="gear"
			label={t('settings-title')}
			zone="band"
			aria-haspopup="dialog"
			aria-expanded={open}
			onclick={() => (open = true)}
		/>
	</div>
{:else}
	<button
		type="button"
		class="band-item"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = true)}
	>
		{t('settings-title')}
	</button>
{/if}
<SettingsPanel bind:open />

<style>
	/* The gear stands at the right end of its header. */
	.end {
		margin-left: auto;
	}
</style>
