<!-- The home screen. Until the path through the levels is drawn (step 21f), it lists them under
     their chapters, a level still locked without its link; its header says how many are done and
     draws the bar of the progress. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n.ts';
	import { chapterMessage, inChapters, levelMessage } from '#lib/levels/levels.ts';
	import { currentProgress } from '#lib/progress/current-progress.svelte.ts';
	import { isOpen, levelsDone } from '#lib/progress/progress.ts';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** The stable names of the levels, in their order. */
	const names = $derived(data.levels.map(({ name }) => name));

	/** The levels done, and how many there are. */
	const progress = $derived({ done: levelsDone(currentProgress(), names), total: names.length });

	/** The chapters, in their order, each with its levels. */
	const chapters = $derived(inChapters(data.levels));
</script>

<svelte:head>
	<title>{t('app-name')}</title>
</svelte:head>

<Header {progress}>
	<p class="done">{t('progress-done', progress)}</p>
	<nav>
		<a class="band-item" href={resolve('sandbox')}>{t('screen-sandbox')}</a>
		<a class="band-item" href={resolve('manual')}>{t('screen-manual')}</a>
		<SettingsButton />
	</nav>
</Header>
<main>
	{#each chapters as { chapter, levels } (chapter)}
		<section>
			<h2>{t(chapterMessage(chapter, 'title'))}</h2>
			<ol>
				{#each levels as { number, name } (name)}
					{@const text = t('screen-level', { number, title: t(levelMessage(name, 'title')) })}
					<li>
						{#if isOpen(currentProgress(), names, number)}
							<a href={resolve(`levels/${String(number)}`)}>{text}</a>
						{:else}
							<span>{text}</span>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</main>

<style>
	/* How many levels are done, in the middle of the header. */
	.done {
		position: absolute;
		left: 50%;
		margin: 0;
		transform: translateX(-50%);
		color: var(--weak);
	}

	/* The links of the home screen, at the right end of the header. */
	nav {
		display: flex;
		gap: var(--space-2);
		margin-left: auto;
	}

	main {
		padding: var(--space-40);
		overflow: auto;
		background: var(--surface);
	}

	h2 {
		margin: 0 0 var(--space-8);
		color: var(--weak);
		font-size: var(--size-label);
		font-weight: var(--weight-strong);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}

	section + section {
		margin-top: var(--space-24);
	}

	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li a,
	li span {
		display: inline-block;
		padding: var(--space-6) var(--space-12);
		border-radius: var(--radius);
		color: var(--text);
		font-size: var(--size-lead);
		font-weight: var(--weight-strong);
		text-decoration: none;
	}

	li span {
		color: var(--weak);
	}

	li a:hover {
		background: var(--hover);
	}
</style>
