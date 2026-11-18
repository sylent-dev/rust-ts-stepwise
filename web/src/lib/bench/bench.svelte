<!-- The bench of the animations (step 14b), in the column of the code until the running of step 17
     replaces it: a short program made for the map of the screen, played on that map with Run,
     Pause, Step, Reset and the five speeds, the line of its next step marked. Created once the
     core has loaded. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { Run } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import { SPEEDS } from '#lib/pace.ts';
	import { NORMAL_SPEED, Playback } from '#lib/playback.svelte.ts';
	import { benchPrograms } from './bench-programs.ts';

	interface Props {
		/** The name of the level of the map, or `sandbox`. */
		map: string;
		/** Starts a program on the map of the screen. */
		start: (text: string) => Run;
		/** The program played, which the map of the screen draws. */
		playback?: Playback;
	}

	let { map, start, playback = $bindable() }: Props = $props();

	const programs = $derived(benchPrograms(map));
	let chosen = $state(0);
	const program = $derived(programs[chosen] ?? programs[0]);
	const lines = $derived(program?.text.trimEnd().split('\n') ?? []);
	let rate = $state<number>(NORMAL_SPEED);

	let frame: number | undefined;

	/** Asks for an animation frame, unless one is already asked. */
	function wake(): void {
		frame ??= requestAnimationFrame(loop);
	}

	function loop(time: number): void {
		frame = undefined;
		if (playback?.tick(time)) wake();
	}

	// A new playback for each program, freed with its run once another one replaces it.
	$effect(() => {
		const text = program?.text ?? '';
		const begin = start;
		const run = (): Run => begin(text);
		const created = untrack(() => {
			const playback = new Playback(run);
			playback.rate = rate;
			return playback;
		});
		playback = created;
		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			frame = undefined;
			created.free();
		};
	});

	function toggle(): void {
		if (!playback) return;
		if (playback.running) {
			playback.pause();
		} else {
			playback.play();
		}
		wake();
	}

	function step(): void {
		playback?.step();
		wake();
	}

	function chooseSpeed(speed: number): void {
		rate = speed;
		if (playback) playback.rate = speed;
	}
</script>

<section>
	<h2>{t('bench-title')}</h2>

	<label>
		{t('bench-program')}
		<select bind:value={chosen}>
			{#each programs as { name }, index (name)}
				<option value={index}>{t(`bench-program-${name}`)}</option>
			{/each}
		</select>
	</label>

	<!-- The line of the next step is marked, as the editor of step 16 will highlight it. -->
	<ol aria-label={t('bench-lines')}>
		{#each lines as text, index (index)}
			<li aria-current={index + 1 === playback?.line ? 'step' : undefined}><code>{text}</code></li>
		{/each}
	</ol>

	{#if playback}
		<p class="controls">
			<!-- One button whose label changes, so that it keeps the focus of the keyboard. -->
			<button type="button" onclick={toggle}>
				{playback.running
					? t('bench-pause')
					: playback.steps > 0 && !playback.ended
						? t('bench-resume')
						: t('bench-run')}
			</button>
			<button type="button" onclick={step} disabled={playback.running || playback.ended}>
				{t('bench-step')}
			</button>
			<button type="button" onclick={() => playback?.reset()}>{t('bench-reset')}</button>
		</p>

		<fieldset>
			<legend>{t('bench-speed')}</legend>
			{#each SPEEDS as speed (speed)}
				<button type="button" aria-pressed={speed === rate} onclick={() => chooseSpeed(speed)}>
					{Number.isFinite(speed)
						? t('bench-speed-rate', { rate: speed })
						: t('bench-speed-instant')}
				</button>
			{/each}
		</fieldset>

		<p>
			{t('bench-steps', { count: playback.steps })}
			{#if playback.ended}· {t('bench-ended')}{/if}
		</p>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-24);
	}

	h2 {
		margin: 0;
		font-size: var(--size-lead);
	}

	ol {
		margin: 0;
		padding-left: var(--space-40);
		font: var(--weight-code) var(--size-code) / var(--line-code) var(--font-code);
	}

	code {
		font: inherit;
		white-space: pre;
	}

	li[aria-current] {
		background: var(--current);
	}

	.controls {
		display: flex;
		gap: var(--space-8);
		margin: 0;
	}

	fieldset {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
		margin: 0;
	}

	button[aria-pressed='true'] {
		font-weight: var(--weight-strong);
	}

	p {
		margin: 0;
	}
</style>
