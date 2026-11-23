<!-- The console, under the map (see Console in specs.md): the log of the last **Run** of the
     program shown (console-log.svelte.ts), in the font of the code. The lines that `print` wrote,
     in order, the last ones in sight while the program writes; the errors, each one big button
     that puts the cursor at its place in the code; under the errors that kept the program from
     starting, why nothing moved. Alone under its tab until the variables come beside it (step
     19), as a title from 1,600 pixels wide, where the two stand side by side without tabs.

     It isn't read to a screen reader as it changes: a program may print thousands of lines in a
     second, and the status bar says already where the program stands. -->
<script lang="ts">
	import { errorText, type ErrorText } from '#lib/errors/error-text.ts';
	import { runtimeErrorText } from '#lib/errors/runtime-error-text.ts';
	import { t } from '#lib/i18n.ts';
	import { type ConsoleLog, KEPT_LINES, type ListedError } from './console-log.svelte.ts';

	interface Props {
		/** The log of the program shown; nothing while the screen has no program. */
		log: ConsoleLog | undefined;
		/** Puts the cursor at a place of the code, that of an error clicked. */
		onshow: (at: number) => void;
	}

	let { log, onshow }: Props = $props();

	const nameId = $props.id();

	/** The block that scrolls the lines. */
	let panel = $state<HTMLElement>();

	/**
	 * Whether the console keeps its last lines in sight as they come: until the learner scrolls
	 * up to read, and again once they are back at the end. Not a signal: only the scroll writes it,
	 * and the effects that read it run as the log changes.
	 */
	let following = true;

	function onscroll() {
		if (!panel) return;
		following = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
	}

	// A new report: the errors that the checks found from their first one, and a program that
	// starts from its end, which its lines follow.
	$effect(() => {
		const report = log?.report ?? 0;
		if (!panel || report === 0) return;
		following = log?.kind !== 'checked';
		panel.scrollTop = following ? panel.scrollHeight : 0;
	});

	// More lines, or the error that stopped the program: in sight, unless the learner reads above.
	// Once the lines kept are as many as the console keeps, a new one takes the place of the first
	// and the end stays where it was.
	$effect(() => {
		const shown = (log?.lines.length ?? 0) + (log?.errors.length ?? 0);
		if (panel && following && shown > 0) panel.scrollTop = panel.scrollHeight;
	});

	/** The two sentences of an error listed, of the checks or of the run. */
	function sentences(listed: ListedError): ErrorText {
		return listed.found === 'checks' ? errorText(listed.error) : runtimeErrorText(listed.error);
	}
</script>

<section class="console" aria-labelledby={nameId}>
	<div class="tabs"><h2 class="tab" id={nameId}>{t('console-name')}</h2></div>
	<div class="panel" bind:this={panel} {onscroll}>
		{#if !log || log.kind === 'empty'}
			<p class="weak">{t('console-empty')}</p>
		{:else}
			{#if log.cut}
				<p class="weak cut">{t('console-cut', { kept: KEPT_LINES })}</p>
			{/if}
			{#if log.lines.length > 0}
				<div class="prints">
					{#each log.lines as line, index (index)}
						<div>{line}</div>
					{/each}
				</div>
			{/if}
			{#each log.errors as listed, index (index)}
				{@const { title, rule } = sentences(listed)}
				<button
					type="button"
					class="error"
					onclick={() => {
						onshow(listed.at);
					}}
				>
					<span class="line">{t('console-line', { line: listed.line })}</span>
					<span><strong>{title}</strong><br />{rule}</span>
				</button>
			{/each}
			{#if log.kind === 'checked'}
				<p class="weak fix">{t('console-fix', { errors: log.errors.length })}</p>
			{/if}
		{/if}
	</div>
</section>

<style>
	/* The tab above, then the lines, which scroll past the height of the block. */
	.console {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	/* The tab starts where the text of the panel does. */
	.tabs {
		flex: none;
		display: flex;
		padding: var(--space-6) var(--space-16);
	}

	.tab {
		margin: 0;
		padding: var(--space-4) var(--space-12);
		border-radius: var(--radius);
		background: var(--chosen-soft);
		color: var(--text);
		font-size: var(--size-text);
		font-weight: var(--weight-control);
	}

	/* From about 1,600 pixels wide, the panels stand side by side, each under its title. */
	@media (min-width: 1600px) {
		.tabs {
			padding: var(--space-8) var(--space-16) var(--space-6);
		}

		.tab {
			padding: 0;
			background: none;
		}
	}

	/* Everything in the console is in the font of the code, as the editor. */
	.panel {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: var(--space-8) var(--space-16);
		font: var(--weight-code) var(--size-code-small) / var(--line-code-small) var(--font-code);
		font-variant-ligatures: none;
	}

	p {
		margin: 0;
	}

	.weak {
		color: var(--weak);
	}

	.cut {
		margin-bottom: var(--space-8);
	}

	/* A long line goes on to the next one, without scrolling sideways; an empty line keeps its
	   height. */
	.prints div {
		min-height: var(--line-code-small);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	/* Each kind of message leaves a little room around it. */
	.prints + .error,
	.error + .error,
	.error + .fix {
		margin-top: var(--space-8);
	}

	/* An error is one big button to its place in the code, which lights up whole on hover; its
	   line takes one column, so that the messages of a list line up. */
	.error {
		display: grid;
		grid-template-columns: 7ch 1fr;
		gap: var(--space-12);
		width: calc(100% + 2 * var(--space-6));
		margin: 0 calc(-1 * var(--space-6));
		padding: var(--space-2) var(--space-6);
		border: 0;
		border-radius: var(--radius);
		background: none;
		text-align: left;
	}

	.error:hover {
		background: var(--chosen-soft);
	}

	.line {
		color: var(--error);
		font-weight: var(--weight-code-strong);
	}

	strong {
		font-weight: var(--weight-code-strong);
	}
</style>
