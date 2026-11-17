<!-- The level screen. Its blocks come with the next steps: the map (step 14), the editor
     (step 16), the running (step 17). -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import { titleMessage } from '#lib/levels.ts';
	import Header from '#lib/shell/header.svelte';
	import Place from '#lib/shell/place.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const title = $derived(t(titleMessage(data.name)));
</script>

<svelte:head>
	<title>{t('page-title', { page: t('level-numbered', { number: data.number, title }) })}</title>
</svelte:head>

<Header>
	<Place {title} />
</Header>
<main></main>

<style>
	main {
		background: var(--surface);
	}
</style>
