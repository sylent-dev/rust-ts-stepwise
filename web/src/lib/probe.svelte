<!-- The probe of step 4c, on the real machine since step 10d, thrown away by the map view of
     step 14 and the running of step 17: a real program run on the map of the sandbox, advanced
     by `step()` at each animation frame at the chosen speed, the map read from the core at each
     frame that ran a step, the robot moved by CSS transitions. Created once the core has loaded. -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import sandboxFile from '../../levels/sandbox.toml?raw';
	import { Sandbox, type Color, type Direction } from '#lib/core.ts';
	import { t } from '#lib/i18n.ts';
	import { paceFrame, runInstant, SPEEDS, START_CARRY } from '#lib/pace.ts';
	import { PROBE_PROGRAM } from '#lib/probe-program.ts';

	/** The size of a cell, in the units of the drawings of the world elements. */
	const CELL = 64;
	/** The time an **Instant** frame spends running steps, so that the page still draws. */
	const INSTANT_BUDGET = 8;
	/** The share of the time between two steps an animation takes, at an animated speed. */
	const ANIMATION_SHARE = 0.8;
	/** The robot of the drawings looks north. */
	const ANGLES: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270 };
	/** The neighbor of a cell in each direction, as columns and rows. */
	const NEIGHBORS: Record<Direction, { x: number; y: number }> = {
		north: { x: 0, y: -1 },
		east: { x: 1, y: 0 },
		south: { x: 0, y: 1 },
		west: { x: -1, y: 0 }
	};
	/** The shades of the paints (see Look of the world in specs.md). */
	const PAINTS: Record<Color, string> = { red: '#dc2f34', yellow: '#ffb300', blue: '#2459d6' };

	const lines = PROBE_PROGRAM.trimEnd().split('\n');
	const sandbox = new Sandbox(sandboxFile);
	let run = sandbox.start(PROBE_PROGRAM);
	const start = run.world();

	let running = $state(false);
	let speed = $state(2);
	// A world is never changed but replaced whole: `$state` would wrap each of its cells.
	let world = $state.raw(start);
	let line = $state(run.line);
	let steps = $state(0);
	let angle = $state(ANGLES[start.robot.direction]);
	let measured = $state<number>();

	const rate = $derived(SPEEDS[speed]);
	const duration = $derived(Number.isFinite(rate) ? (ANIMATION_SHARE * 1000) / rate : 0);

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

	/** Copies the run of the core into the page, once per frame whatever the steps run. */
	function draw(): void {
		world = run.world();
		line = run.line;
		steps = run.steps;
		// The shortest turn to the new direction, so that the robot never spins the long way
		// around: the angle grows or shrinks without bound rather than wrapping at 360.
		const target = ANGLES[world.robot.direction];
		angle += ((((target - angle) % 360) + 540) % 360) - 180;
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

	onDestroy(() => {
		pause();
		run.free();
		sandbox.free();
	});
</script>

<section>
	<h2>{t('probe-title')}</h2>
	<svg
		viewBox="0 0 {world.width * CELL} {world.height * CELL}"
		width={world.width * CELL}
		height={world.height * CELL}
		role="img"
		aria-label={t('probe-map')}
	>
		{#each world.cells as cell, index (index)}
			<g
				transform="translate({(index % world.width) * CELL} {Math.floor(index / world.width) *
					CELL})"
			>
				<rect class={cell.type} width={CELL} height={CELL} />
				{#if cell.type === 'floor'}
					{#if cell.paint}
						<!-- A stroke from the middle of the cell toward each painted passage, as the map
						     view of step 14 will draw it. -->
						<g stroke={PAINTS[cell.paint.color]} fill={PAINTS[cell.paint.color]}>
							<circle cx="32" cy="32" r="14" stroke="none" />
							{#each cell.paint.passages as passage (passage)}
								<line
									x1="32"
									y1="32"
									x2={32 + 32 * NEIGHBORS[passage].x}
									y2={32 + 32 * NEIGHBORS[passage].y}
									stroke-width="28"
								/>
							{/each}
						</g>
					{/if}
					{#if cell.item}
						<!-- The item of docs/mockups/world-elements/daylight/item.svg, copied for the probe. -->
						<path
							d="M32 19 L43.3 25.5 L43.3 38.5 L32 45 L20.7 38.5 L20.7 25.5 Z"
							fill="#5fd0b0"
							stroke="#222935"
							stroke-width="2.5"
							stroke-linejoin="round"
						/>
						<path
							d="M32 26.5 L36.8 29.2 L36.8 34.8 L32 37.5 L27.2 34.8 L27.2 29.2 Z"
							fill="#222935"
						/>
					{/if}
				{/if}
			</g>
		{/each}
		<g
			class="robot"
			style:transform="translate({world.robot.position.x * CELL}px, {world.robot.position.y *
				CELL}px) rotate({angle}deg)"
			style:transition-duration="{duration}ms"
		>
			<!-- The robot of docs/mockups/world-elements/daylight/robot.svg, copied for the probe. -->
			<rect x="11" y="15" width="8" height="34" rx="3" fill="#222935" />
			<rect x="45" y="15" width="8" height="34" rx="3" fill="#222935" />
			<rect
				x="16"
				y="14"
				width="32"
				height="36"
				rx="9"
				fill="#ffffff"
				stroke="#222935"
				stroke-width="1.5"
			/>
			<rect x="20" y="18" width="24" height="11" rx="5.5" fill="#222935" />
			<circle cx="26.5" cy="23.5" r="2.8" fill="#3fc3ff" />
			<circle cx="37.5" cy="23.5" r="2.8" fill="#3fc3ff" />
			<rect x="21" y="32" width="22" height="15" rx="3.5" fill="#d5dbe3" />
		</g>
	</svg>

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
	.floor {
		fill: #e1e5ea;
		stroke: #cad1da;
		stroke-width: 1;
	}

	.wall {
		fill: #5d687a;
	}

	/* The robot is drawn in a cell at the origin: it turns around the center of that cell,
	   then moves to its own. */
	.robot {
		transform-origin: 32px 32px;
		transition-property: transform;
		transition-timing-function: ease-in-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.robot {
			transition: none;
		}
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
