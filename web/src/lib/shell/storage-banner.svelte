<!-- The banner of a browser that refuses to save (see Error handling in specs.md): one line
     across the whole width, under the header. Pale amber, without icon: a warning, not an
     error. × hides it until the page is loaded again. -->
<script lang="ts">
	import Icon from '#lib/icon.svelte';
	import { t } from '#lib/i18n.ts';
	import { saving } from '#lib/storage/browser-store.svelte.ts';
</script>

{#if saving.refused && !saving.bannerHidden}
	<div class="banner" role="status">
		<span>{t('storage-refused')}</span>
		<button
			type="button"
			class="hide"
			title={t('storage-refused-hide')}
			aria-label={t('storage-refused-hide')}
			onclick={() => (saving.bannerHidden = true)}
		>
			<Icon name="close" size={14} />
		</button>
	</div>
{/if}

<style>
	/* Its height comes from its line of text; the screen under it takes what is left. */
	.banner {
		flex: none;
		display: flex;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-8) var(--space-8) var(--space-8) var(--space-16);
		background: var(--accent-soft);
	}

	span {
		flex: 1;
	}

	/* The cross, at the right end: weaker than the text until the pointer is over it. */
	.hide {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: none;
		opacity: 0.7;
	}

	.hide:hover {
		background: var(--shade);
		opacity: 1;
	}
</style>
