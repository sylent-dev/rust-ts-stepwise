<!-- The manual. Until its sections are written (step 22), its page has only the column of the
     sections, with the name at its top, which leads back to the home screen. -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import Header from '#lib/shell/header.svelte';
</script>

<svelte:head>
	<title>{t('page-title', { page: t('manual') })}</title>
</svelte:head>

<main>
	<!-- The manual has no header across the window: the top of its column is as high as the header
	     of the other screens, the name at the same place. -->
	<aside><Header home /></aside>
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
</style>
