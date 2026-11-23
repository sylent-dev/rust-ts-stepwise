<!-- The status bar, under the code, as in a code editor (see Level screen in specs.md): the state
     of the program in the color of its state (status.ts) and the number of errors that the checks
     underline, on the left; the steps run, the speed in five squares to click, and the place of
     the cursor, on the right, so that nothing moves when the state changes its length, nor while
     the steps count up. When the learner tries to change a locked code, it holds the reason on
     the amber, then the amber fades under the state (lock-flash.svelte.ts).

     The squares are for the pointer: the keyboard chooses a speed in **Run › Speed**, as the
     status bar of a code editor takes no stop of Tab. Each names its speed in the tip of the
     browser, as the buttons of a band do, and a press on one leaves the keyboard where it was,
     the code most often. -->
<script lang="ts">
	import type { Cursor } from '#lib/editor/cursor.ts';
	import { t } from '#lib/i18n.ts';
	import { SPEEDS } from '#lib/run/pace.ts';
	import type { LockFlash } from './lock-flash.svelte.ts';
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
		/** The flash of a locked code, which the bar plays and tells where it stands. */
		flash: LockFlash;
	}

	let { status, errors, steps, speed, cursor, flash }: Props = $props();

	/** The bar, whose animations a new try starts again. */
	let bar = $state<HTMLElement>();

	/** Whether a flash shows, and whether its reason shows in place of the state, as it holds. */
	const flashing = $derived(flash.number > 0);
	const holding = $derived(flashing && flash.phase === 'hold');

	// Each try starts the flash again from its hold, whatever the bar has drawn meanwhile: two
	// tries in one frame of the page would leave its class as the page saw it, and an animation
	// that has ended can't be found on the bar to start again. So its class goes, the style of
	// the bar is brought up to date (`getAnimations`), which ends the animations of the flash,
	// and it comes back, which starts them anew.
	$effect(() => {
		if (flash.number === 0 || !bar) return;
		bar.classList.remove('flashing');
		bar.getAnimations();
		bar.classList.add('flashing');
	});

	/** Follows the flash: its hold, then its fade, end. The animations of the bar alone count. */
	function onanimationend(event: AnimationEvent) {
		if (event.target !== event.currentTarget || !flashing) return;
		if (event.animationName.endsWith('status-hold')) flash.held();
		else if (event.animationName.endsWith('status-fade')) flash.end();
	}

	/** The squares lit: those of the speeds up to the one in use. */
	const lit = $derived(SPEEDS.indexOf(speed.current));

	/** A press of the pointer on a square leaves the focus where it was. */
	function keepFocus(event: MouseEvent) {
		event.preventDefault();
	}
</script>

<div class="status-bar {status.tone}" class:flashing class:holding {onanimationend} bind:this={bar}>
	<!-- Read to a screen reader as it changes: the state alone, since the steps change too
	     often. -->
	<span class="state" role="status">{holding ? t('status-locked') : status.text}</span>
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
	   doesn't shake. 30 pixels high, as in the mock-up. What a longer language wouldn't fit in a
	   window of 1280 pixels is hidden rather than pushed past the edge (see the backlog). */
	.status-bar {
		/* The flash: the reason held on the amber for most of its time, then the amber fading
		   under the state, in its own color; tuned by eye (decided on 2026-11-23: a reason that
		   faded with the amber couldn't be read in Night Desk, its text crossing the tone of the
		   bar). */
		--hold: calc(var(--duration-flash) * 0.6);
		--fade: calc(var(--duration-flash) - var(--hold));
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-24);
		height: 30px;
		padding: 0 var(--space-12);
		overflow: hidden;
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

	:is(.paused, .failed, .passed, .holding) :is(.state, .errors) {
		color: inherit;
	}

	/* The flash: the learner tried to change a locked code. The bar is amber at once with the
	   reason, then the amber fades under the state and the texts, in their own colors. While the
	   program is paused, the bar is amber already: its text alone changes. Kept for a learner who
	   asked for less motion: it is a change of tone, nothing moves. */
	.flashing {
		animation:
			status-hold var(--hold) linear,
			status-fade var(--fade) var(--ease-appear) var(--hold);
	}

	@keyframes status-hold {
		from,
		to {
			background: var(--accent);
			color: var(--on-accent);
		}
	}

	@keyframes status-fade {
		from {
			background: var(--accent);
		}
	}

	/* The steps, the speed and the cursor on the right: the steps grow to the left as they count
	   up, the speed after them staying in place. */
	.steps {
		margin-left: auto;
	}

	.speed {
		display: flex;
		align-self: stretch;
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
		align-self: stretch;
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

	/* Room for `Ln 99, Col 80`, a program of fewer than 100 lines kept under 80 characters, so that
	   the speed stays in place as the learner types: tuned by eye, the figures being of one width
	   and the words around them not. */
	.cursor {
		min-width: 10ch;
		text-align: right;
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
