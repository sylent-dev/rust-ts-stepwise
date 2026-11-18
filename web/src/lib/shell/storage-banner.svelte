<!-- The banner of a browser that refuses to save (see Error handling in specs.md): one line
     across the whole width, under the header. Pale amber, without icon: a warning, not an
     error. × hides it until the page is loaded again. -->
<script lang="ts" module>
	/**
	 * Whether the learner hid the banner. That choice can't be saved either: it holds while the
	 * page stays open, from a screen to the next, each of which draws a banner of its own.
	 */
	let hidden = $state(false);
</script>

<script lang="ts">
	import Icon from '#lib/icon.svelte';
	import { t } from '#lib/i18n.ts';
	import { saving } from '#lib/storage/browser-store.svelte.ts';
</script>

<!-- Always in the page, empty while the browser saves: a screen reader announces what changes
     in a region it already knows, as when the storage fills up during a visit. -->
<div class="region" role="status">
	{#if saving.refused && !hidden}
		<div class="banner">
			<span>{t('storage-refused')}</span>
			<button
				type="button"
				class="hide"
				title={t('storage-refused-hide')}
				aria-label={t('storage-refused-hide')}
				onclick={() => (hidden = true)}
			>
				<Icon name="close" size={14} />
			</button>
		</div>
	{/if}
</div>

<style>
	/* Its height comes from its line of text, none when it is empty; the screen under it takes
	   what is left. */
	.region {
		flex: none;
	}

	.banner {
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
