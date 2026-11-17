<!-- The home screen. Until the path through the levels is drawn (step 21), it lists them. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n.ts';
	import { levels, titleMessage } from '#lib/levels.ts';
	import Header from '#lib/shell/header.svelte';
</script>

<svelte:head>
	<title>{t('app-name')}</title>
</svelte:head>

<Header>
	<nav>
		<a class="band-item" href={resolve('/sandbox')}>{t('sandbox')}</a>
		<a class="band-item" href={resolve('/manual')}>{t('manual')}</a>
	</nav>
</Header>
<main>
	<ol>
		{#each levels as { number, name } (name)}
			<li>
				<a href={resolve('/levels/[number]', { number: String(number) })}>
					{t('level-numbered', { number, title: t(titleMessage(name)) })}
				</a>
			</li>
		{/each}
	</ol>
</main>

<style>
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

	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li a {
		display: inline-block;
		padding: var(--space-6) var(--space-12);
		border-radius: var(--radius);
		color: var(--text);
		font-size: var(--size-lead);
		font-weight: var(--weight-strong);
		text-decoration: none;
	}

	li a:hover {
		background: var(--hover);
	}
</style>
