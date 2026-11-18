<!-- The probe of step 4c, on the real machine since step 10d, which becomes the bench of the
     animations (step 14b) until the running of step 17 replaces it: a real program run on the
     map of the sandbox, advanced by `step()` at each animation frame at the chosen speed, the
     world read from the core at each frame that ran a step and given to the map of the screen.
     Created once the core has loaded. -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import sandboxFile from '../../levels/sandbox.toml?raw';
	import { Sandbox, type World } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import { paceFrame, runInstant, SPEEDS, START_CARRY } from '#lib/pace.ts';
	import { PROBE_PROGRAM } from '#lib/probe-program.ts';

	/** The world of the program, as its last step left it, for the map of the screen. */
	let { world = $bindable() }: { world?: World } = $props();

	/** The time an **Instant** frame spends running steps, so that the page still draws. */
	const INSTANT_BUDGET = 8;

	const lines = PROBE_PROGRAM.trimEnd().split('\n');
	const sandbox = new Sandbox(sandboxFile);
	let run = sandbox.start(PROBE_PROGRAM);

	let running = $state(false);
	let speed = $state(2);
	let line = $state(run.line);
	let steps = $state(0);
	let measured = $state<number>();

	const rate = $derived(SPEEDS[speed]);

	let frame: number | undefined;
	let last = 0;
	let carry = START_CARRY;
	let measureStart = 0;
	let measureSteps = 0;

	/** Runs one step of the program, and tells whether it still runs after it. */
	function step(): boolean {
		run.step();
		return run.line !== undefined;
	}

	/** Copies the run of the core into the page: once per frame that ran steps, and at **Reset**. */
	function draw(): void {
		world = run.world();
		line = run.line;
		steps = run.steps;
	}

	function tick(time: number): void {
		let count = 0;
		if (Number.isFinite(rate)) {
			const paced = paceFrame(rate, time - last, carry);
			carry = paced.carry;
			if (paced.step) {
				step();
				count = 1;
			}
		} else {
			count = runInstant(step, performance.now(), INSTANT_BUDGET, () => performance.now());
			measureSteps += count;
			if (time - measureStart >= 1000) {
				measured = Math.round((measureSteps * 1000) / (time - measureStart));
				measureStart = time;
				measureSteps = 0;
			}
		}
		last = time;
		if (count > 0) {
			draw();
		}
		if (run.line === undefined) {
			pause();
		} else {
			frame = requestAnimationFrame(tick);
		}
	}

	function startMeasure(): void {
		measured = undefined;
		measureStart = performance.now();
		measureSteps = 0;
	}

	function play(): void {
		running = true;
		last = performance.now();
		startMeasure();
		frame = requestAnimationFrame(tick);
	}

	function pause(): void {
		running = false;
		if (frame !== undefined) {
			cancelAnimationFrame(frame);
			frame = undefined;
		}
	}

	/** Ends the run, no frame being left to step it once freed, and starts another one. */
	function reset(): void {
		pause();
		run.free();
		run = sandbox.start(PROBE_PROGRAM);
		carry = START_CARRY;
		measured = undefined;
		draw();
	}

	function chooseSpeed(index: number): void {
		speed = index;
		startMeasure();
	}

	draw();

	onDestroy(() => {
		pause();
		run.free();
		sandbox.free();
	});
</script>

<section>
	<h2>{t('probe-title')}</h2>

	<!-- The line of the next step is marked, as the editor of step 16 will highlight it. -->
	<ol aria-label={t('probe-program')}>
		{#each lines as text, index (index)}
			<li aria-current={index + 1 === line ? 'step' : undefined}><code>{text}</code></li>
		{/each}
	</ol>

	<p>
		<!-- One button whose label changes, so that it keeps the focus of the keyboard. -->
		<button type="button" onclick={running ? pause : play}>
			{running ? t('probe-pause') : t('probe-run')}
		</button>
		<button type="button" onclick={reset}>{t('probe-reset')}</button>
	</p>

	<fieldset>
		<legend>{t('probe-speed')}</legend>
		{#each SPEEDS as speedRate, index (speedRate)}
			<button type="button" aria-pressed={index === speed} onclick={() => chooseSpeed(index)}>
				{Number.isFinite(speedRate)
					? t('probe-speed-rate', { rate: speedRate })
					: t('probe-speed-instant')}
			</button>
		{/each}
	</fieldset>

	<p aria-live="off">
		{running && measured !== undefined && !Number.isFinite(rate)
			? t('probe-steps-measured', { count: steps, rate: measured })
			: t('probe-steps', { count: steps })}
	</p>
	{#if line === undefined}
		<p role="status">{t('probe-stopped')}</p>
	{/if}
</section>

<style>
	section {
		padding: var(--space-24);
	}

	ol {
		font-family: monospace;
	}

	code {
		white-space: pre;
	}

	li[aria-current] {
		background: #ffe9a8;
	}

	button[aria-pressed='true'] {
		font-weight: bold;
	}
</style>
