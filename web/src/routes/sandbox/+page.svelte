<!-- The sandbox: the level screen without goal. The page loads its file, the core reads it, and
     the screen plays on its open map. -->
<script lang="ts">
	import { Sandbox } from '#lib/core.ts';
	import { fromCore } from '#lib/core-ready.svelte.ts';
	import { t } from '#lib/i18n.ts';
	import LevelScreen from '#lib/level-screen/level-screen.svelte';
	import { sandboxPlayground } from '#lib/level-screen/playground.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** The sandbox, from the text of its file, kept in the module while its screen is open. */
	const sandbox = fromCore(() => new Sandbox(data.text));

	const playground = $derived(sandbox.current && sandboxPlayground(sandbox.current));
</script>

<svelte:head>
	<title>{t('tab-title', { page: t('screen-sandbox') })}</title>
</svelte:head>

<LevelScreen screen="sandbox" title={t('screen-sandbox')} {playground} />
