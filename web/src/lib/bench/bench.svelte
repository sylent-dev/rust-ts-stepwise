<!-- The bench of the animations (step 14b), in the zone of the panels until the running of step 17
     replaces it: a short program made for the map of the screen, played on that map with Run,
     Pause, Step, Reset and the five speeds, the line of its next step marked. Its programs are
     its own: the code of the editor isn't run yet. Created once the core has loaded. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { Run } from '#lib/core/core.ts';
	import { t } from '#lib/i18n.ts';
	import type { Playground } from '#lib/level-screen/playground.ts';
	import { SPEEDS } from '#lib/run/pace.ts';
	import { NORMAL_SPEED, Playback } from '#lib/run/playback.svelte.ts';
	import { benchPrograms, programMessage } from './bench-programs.ts';

	interface Props {
		/** What the screen plays on: its name chooses the programs, which start on its map. */
		playground: Playground;
		/** The program played, which the map of the screen draws. */
		playback?: Playback;
	}

	let { playground, playback = $bindable() }: Props = $props();

	const programs = $derived(benchPrograms(playground.name));
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
		const { start } = playground;
		const run = (): Run => start(text);
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
		if (playback.status === 'running') {
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
	<div class="board">
		<h2>{t('bench-title')}</h2>

		<label>
			{t('bench-program')}
			<select bind:value={chosen}>
				{#each programs as { name }, index (name)}
					<option value={index}>{t(programMessage(name))}</option>
				{/each}
			</select>
		</label>

		{#if playback}
			<p class="controls">
				<!-- One button whose label changes, so that it keeps the focus of the keyboard. -->
				<button type="button" onclick={toggle}>
					{playback.status === 'running'
						? t('bench-pause')
						: playback.status === 'paused'
							? t('bench-resume')
							: t('bench-run')}
				</button>
				<button type="button" onclick={step} disabled={playback.status === 'running'}>
					{t('bench-step')}
				</button>
				<button type="button" onclick={() => playback?.reset()}>{t('bench-reset')}</button>
			</p>

			<!-- A list rather than five buttons: the zone of the panels is low. -->
			<label>
				{t('bench-speed')}
				<select bind:value={() => rate, chooseSpeed}>
					{#each SPEEDS as speed (speed)}
						<option value={speed}>
							{Number.isFinite(speed)
								? t('bench-speed-rate', { rate: speed })
								: t('bench-speed-instant')}
						</option>
					{/each}
				</select>
			</label>

			<p>{t('bench-steps', { count: playback.steps })}</p>
			{#if playback.outcome?.type === 'failed'}
				<p role="status">{t('bench-failed', { line: playback.outcome.error.span.line })}</p>
			{:else if playback.outcome?.type === 'passed'}
				<p role="status">{t('bench-passed')}</p>
			{:else if playback.outcome?.type === 'goals-not-met'}
				<p role="status">{t('bench-goals-not-met')}</p>
			{:else if playback.ended}
				<p role="status">{t('bench-ended')}</p>
			{/if}
		{/if}
	</div>

	<!-- The line of the next step is marked, as the editor will highlight it (step 17). -->
	<ol aria-label={t('bench-lines')}>
		{#each lines as text, index (index)}
			<li aria-current={index + 1 === playback?.line ? 'step' : undefined}><code>{text}</code></li>
		{/each}
	</ol>
</section>

<style>
	/* Two columns in the low zone of the panels: the controls, then the lines of the program. */
	section {
		display: flex;
		gap: var(--space-24);
		padding: var(--space-12) var(--space-24);
	}

	.board {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	h2 {
		margin: 0;
		font-size: var(--size-text);
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

	p {
		margin: 0;
	}
</style>
