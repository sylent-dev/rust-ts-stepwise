<!-- The name beside the logo (see Look of the world in specs.md): the head of the robot is 1.25
     times as tall as the capitals, its middle meets the middle of the lowercase letters, raised by
     0.011 em, and the name starts 0.3 em after it. With `home`, it leads to the home screen. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { logo } from '#lib/elements.ts';
	import { t } from '#lib/i18n.ts';

	let { home = false }: { home?: boolean } = $props();
</script>

{#snippet name()}
	<img src={logo} alt="" />
	<span>{t('app-name')}</span>
{/snippet}

{#if home}
	<a class="wordmark" href={resolve('/')} title={t('all-levels')}>{@render name()}</a>
{:else}
	<div class="wordmark">{@render name()}</div>
{/if}

<style>
	.wordmark {
		/* The heights of a capital and of a lowercase letter of Fredoka in semi-bold, in em: what
		   a browser measures for `S` and `x` (step 13a). */
		--capital: 0.71;
		--lowercase: 0.51;
		--head: calc(var(--capital) * 1.25em);

		display: flex;
		align-items: baseline;
		color: inherit;
		font: var(--weight-strong) 21px / 1 var(--font-name);
		text-decoration: none;
		text-transform: lowercase;
		white-space: nowrap;
	}

	/* The head stands on the baseline, then goes down until its middle meets the one of the
	   lowercase letters. */
	img {
		height: var(--head);
		margin-right: 0.3em;
		transform: translateY(calc(var(--head) / 2 - var(--lowercase) * 0.5em - 0.011em));
	}
</style>
