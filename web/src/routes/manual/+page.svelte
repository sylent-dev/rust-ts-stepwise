<!-- The manual. Until its sections are written (step 22), its page has only the column of the
     sections, with the name at its top, which leads back to the home screen. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n.ts';
	import Wordmark from '#lib/shell/wordmark.svelte';
</script>

<svelte:head>
	<title>{t('page-title', { page: t('manual') })}</title>
</svelte:head>

<main>
	<aside>
		<a class="name" href={resolve('/')} title={t('all-levels')}><Wordmark /></a>
	</aside>
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 250px 1fr;
		background: var(--surface);
	}

	aside {
		background: var(--band);
	}

	/* The manual has no header across the window: the top of its column is a link as high as the
	   header of the other screens, the name at the same place. */
	.name {
		display: flex;
		align-items: center;
		box-sizing: border-box;
		height: 49px;
		padding: 0 var(--space-12) 3px;
		color: inherit;
		text-decoration: none;
	}

	.name:hover {
		background: var(--band-hover);
	}
</style>
