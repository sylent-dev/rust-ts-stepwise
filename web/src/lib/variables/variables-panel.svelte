<!-- The variables panel, under the map beside the console (see Variables panel in specs.md): the
     variables of the call shown, those that the last step changed standing out, then the calls in
     progress, from the main program to the function being run, a click on one showing its
     variables while it is in progress (run/shown-calls.svelte.ts). A value is written as in a
     program, on one line, cut at the edge of the panel, and a text gives its first 200 characters
     at most; a name takes one column, as wide as the longest one up to 24 characters. In the font
     of the code, as the console. Nothing before the program starts, nor once the map is put back.

     It isn't read to a screen reader as it changes: at the faster speeds it changes at each frame,
     and the status bar says already where the program stands. The block that scrolls takes a stop
     of Tab, as the console. The block that places it gives it its name, its role and the level of
     its titles (level-screen/panels.svelte): under a tab, they come right under the title of the
     screen; side by side, under the title of the panel. -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Call, Value } from '#lib/core/core.ts';
	import { t } from '#lib/i18n.ts';
	import type { CallsView } from '#lib/run/shown-calls.svelte.ts';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** The calls of the program shown; nothing while the screen has no program. */
		calls: CallsView | undefined;
		/** Shows the call of an index among the calls in progress, which the learner clicked. */
		onchoose: (index: number) => void;
		/** The level of its titles: 2 under a tab, 3 under the title of the panel. */
		heading: 2 | 3;
	}

	let { calls, onchoose, heading, ...attributes }: Props = $props();

	/** The element of its titles. */
	const title = $derived(`h${String(heading)}`);

	/** The call shown; nothing before the program starts. */
	const shown = $derived(calls?.shown === undefined ? undefined : calls.calls[calls.shown]);

	/** What the title above the variables says of the call shown. */
	function where(call: Call): string {
		return call.function === undefined
			? t('variables-in-main')
			: t('variables-in-function', { function: call.function });
	}

	/** A call in the list, with the line it is on. */
	function callName(call: Call): string {
		return call.function === undefined
			? t('variables-call-main', { line: call.line })
			: t('variables-call-function', { function: call.function, line: call.line });
	}

	/** A value as the panel writes it: an ellipsis after a text that the core has cut. */
	function written(value: Value): string {
		return value.cut ? `${value.text}…` : value.text;
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (a block that scrolls is reached by Tab, so that the keyboard scrolls it) -->
<div {...attributes} class="panel" tabindex="0">
	{#if !calls || !shown}
		<p class="weak">{t('variables-empty')}</p>
	{:else}
		<svelte:element this={title} class="title">{where(shown)}</svelte:element>
		{#if calls.variables.length === 0}
			<p class="weak none">{t('variables-none')}</p>
		{:else}
			<dl class="values">
				{#each calls.variables as variable, index (index)}
					<div class="value" class:is-changed={variable.changed}>
						<dt>{variable.name}</dt>
						<dd>{written(variable.value)}</dd>
					</div>
				{/each}
			</dl>
		{/if}
		<svelte:element this={title} class="title">{t('variables-calls')}</svelte:element>
		<ol class="calls">
			{#each calls.calls as call, index (call.number)}
				{@const current = index === calls.shown}
				<li>
					<button
						type="button"
						class:is-current={current}
						aria-current={current}
						onclick={() => {
							onchoose(index);
						}}>{callName(call)}</button
					>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	/* Everything in the panel is in the font of the code, as the editor. */
	.panel {
		height: 100%;
		overflow: auto;
		padding: var(--space-8) var(--space-16);
		font: var(--weight-code) var(--size-code-small) / var(--line-code-small) var(--font-code);
		font-variant-ligatures: none;
	}

	p {
		margin: 0;
	}

	.weak,
	.title {
		color: var(--weak);
	}

	.title {
		margin: 0 0 var(--space-4);
		font: inherit;
	}

	.none {
		margin-bottom: var(--space-12);
	}

	/* The names take one column, as wide as the longest one up to 24 characters, so that the
	   values line up; 110 pixels at least, tuned by eye in the mock-up, so that the short names of
	   most programs don't move the values from one call to the next. */
	.values {
		display: grid;
		grid-template-columns: minmax(110px, max-content) minmax(0, 1fr);
		margin: 0 0 var(--space-12);
	}

	.value {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
	}

	/* A name or a value too long for its place is cut, with an ellipsis: each stays on its line. A
	   value keeps its spaces as the program wrote them, several in a row too. */
	dt,
	dd {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	dt {
		max-width: 24ch;
		padding-right: var(--space-12);
		white-space: nowrap;
	}

	dd {
		min-width: 0;
		margin: 0;
		white-space: pre;
	}

	/* A variable that the last step changed stands out, on the whole width of its line. */
	.value.is-changed {
		margin: 0 calc(-1 * var(--space-6));
		padding: 0 var(--space-6);
		border-radius: var(--radius);
		background: var(--accent-soft);
		font-weight: var(--weight-code-strong);
	}

	.calls {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* A call is a button on the whole width of the panel, which lights up on hover; a line of 22
	   pixels, tuned by eye in the mock-up, a little taller than a line of code to be clicked. */
	.calls button {
		display: block;
		width: calc(100% + 2 * var(--space-6));
		margin: 0 calc(-1 * var(--space-6));
		padding: 0 var(--space-6);
		border: 0;
		border-radius: var(--radius);
		background: none;
		line-height: 22px;
		text-align: left;
	}

	.calls button:hover,
	.calls .is-current {
		background: var(--chosen-soft);
	}

	.calls .is-current {
		font-weight: var(--weight-code-strong);
	}
</style>
