<!-- The status bar, under the code, as in a code editor (see Level screen in specs.md): the state
     of the program in the color of its state (status.ts), the number of errors that the checks
     underline, the steps run, the speed in five squares to click, and the place of the cursor.
     When the learner tries to change a locked code, it lights up in amber with the reason, then
     fades back to its color.

     The squares are for the pointer: the keyboard chooses a speed in **Run › Speed**, as the
     status bar of a code editor takes no stop of Tab. Each names its speed in the tip of the
     browser, as the buttons of a band do, and a press on one leaves the keyboard where it was,
     the code most often. -->
<script lang="ts">
	import type { Cursor } from '#lib/editor/cursor.ts';
	import { t } from '#lib/i18n.ts';
	import { SPEEDS } from '#lib/run/pace.ts';
	import { type SpeedSetting, speedName } from './speeds.ts';
	import type { StatusState } from './status.ts';

	interface Props {
		/** The state of the program, and its color. */
		status: StatusState;
		/** The number of errors that the checks underline. */
		errors: number;
		/** The steps run so far. */
		steps: number;
		/** The speed of the programs, which the squares show and choose. */
		speed: SpeedSetting;
		/** The place of the cursor; nothing while the screen has no editor. */
		cursor: Cursor | undefined;
		/**
		 * How many times the learner has tried to change a locked code: the bar lights up at each
		 * new one, and the flash starts again.
		 */
		refusals: number;
	}

	let { status, errors, steps, speed, cursor, refusals }: Props = $props();

	/** The refusals whose flash has ended: the bar lights up while one is left. */
	let faded = $state(0);
	const flashing = $derived(refusals > faded);

	/** The squares lit: those of the speeds up to the one in use. */
	const lit = $derived(SPEEDS.indexOf(speed.current));

	/** A press of the pointer on a square leaves the focus where it was. */
	function keepFocus(event: MouseEvent) {
		event.preventDefault();
	}
</script>

<!-- Two flashes in turn, the same but for their names: a new name starts the animation again,
     so that each refusal lights the bar up anew. -->
<div
	class="status-bar {status.tone}"
	class:flash-odd={flashing && refusals % 2 === 1}
	class:flash-even={flashing && refusals % 2 === 0}
	onanimationend={() => (faded = refusals)}
>
	<!-- Read to a screen reader as it changes: the state alone, since the steps change too
	     often. -->
	<span class="state" role="status">{flashing ? t('status-locked') : status.text}</span>
	{#if errors > 0}
		<span class="errors">{t('status-errors', { errors })}</span>
	{/if}
	<span class="steps">{t('status-steps', { steps })}</span>
	<span class="speed">
		<span class="speed-name">{t('speed-name')}</span>
		{#each SPEEDS as choice, index (choice)}
			<button
				type="button"
				tabindex="-1"
				title={speedName(choice)}
				aria-label={speedName(choice)}
				aria-pressed={choice === speed.current}
				onmousedown={keepFocus}
				onclick={() => {
					speed.choose(choice);
				}}
			>
				<span class="square" class:lit={index <= lit}></span>
			</button>
		{/each}
	</span>
	{#if cursor}
		<span class="cursor">{t('status-cursor', { line: cursor.line, column: cursor.column })}</span>
	{/if}
</div>

<style>
	/* Its numbers change in place while a program runs: figures of one width, so that the text
	   doesn't shake. 30 pixels high, as in the mock-up. */
	.status-bar {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-24);
		height: 30px;
		padding: 0 var(--space-12);
		background: var(--band);
		color: var(--on-status);
		font-size: var(--size-small);
		font-weight: var(--weight-text);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.state {
		color: var(--accent-text);
		font-weight: var(--weight-strong);
	}

	.errors {
		color: var(--error);
		font-weight: var(--weight-strong);
	}

	/* The bar takes the color of the state of the program, as in a code editor; its texts take
	   the color of the bar, the state and the number of errors too, which would not read on it
	   in their own. */
	.paused {
		background: var(--accent);
		color: var(--on-accent);
	}

	.failed {
		background: var(--error);
		color: var(--on-error);
	}

	.passed {
		background: var(--passed);
		color: var(--on-passed);
	}

	:is(.paused, .failed, .passed, .flash-odd, .flash-even) :is(.state, .errors) {
		color: inherit;
	}

	/* The flash: the learner tried to change a locked code. The bar is amber at once, then fades
	   back to its color; the reason stays as long. While the program is paused, the bar is amber
	   already: its text alone changes. Kept for a learner who asked for less motion: it is a
	   change of tone, nothing moves. */
	.flash-odd {
		animation: status-flash-odd var(--duration-flash) var(--ease-appear);
	}

	.flash-even {
		animation: status-flash-even var(--duration-flash) var(--ease-appear);
	}

	@keyframes status-flash-odd {
		from {
			background: var(--accent);
			color: var(--on-accent);
		}
	}

	@keyframes status-flash-even {
		from {
			background: var(--accent);
			color: var(--on-accent);
		}
	}

	/* Room for the steps up to 99,999, so that the speed after them doesn't move each time their
	   number takes a figure more while a program runs: tuned by eye, the figures being of one
	   width and the word after them not. */
	.steps {
		min-width: 12ch;
	}

	.speed {
		display: flex;
		align-items: center;
	}

	.speed-name {
		margin-right: var(--space-6);
	}

	/* A square of the mock-up, 9 by 13 pixels, 2 pixels from the next; its button takes the
	   whole height of the bar, so that the pointer has more than the square to aim at. */
	.speed button {
		display: flex;
		align-items: center;
		height: 30px;
		padding: 0 calc(var(--space-2) / 2);
		border: 0;
		background: none;
	}

	.square {
		width: 9px;
		height: 13px;
		box-sizing: border-box;
		border: 1px solid currentColor;
		border-radius: var(--radius-mark);
	}

	.square.lit {
		background: currentColor;
	}

	.cursor {
		margin-left: auto;
	}

	/* The texts of the bar sit half a pixel low, tuned by eye in the mock-up; the squares stay in
	   place. */
	.state,
	.errors,
	.steps,
	.speed-name,
	.cursor {
		position: relative;
		top: 0.5px;
	}
</style>
