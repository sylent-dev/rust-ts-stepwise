<!-- A panel in the middle of the screen, over a veil that covers it (see Settings in specs.md).
     Escape, × or a click on the veil closes it. It is the `dialog` of the browser, shown as a
     modal: the keys stay in the panel, the screen under the veil can't be clicked, and the focus
     goes back to what opened the panel when it closes. It is there at once, without a motion
     (see Motion in docs/design-system.md). While the message of a window too small takes the
     place of the screen, the dialog is closed, so that nothing blocks the message; it opens
     again with the screen, what it holds kept. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '#lib/icon.svelte';
	import { t } from '#lib/i18n.ts';
	import { currentWindow } from './current-window.svelte.ts';

	interface Props {
		title: string;
		/** Whether it shows. The panel closes itself, and says so here. */
		open: boolean;
		/** Its width, in pixels: the one of its drawing in the mock-up. */
		width: number;
		children: Snippet;
	}

	let { title, open = $bindable(), width, children }: Props = $props();

	const id = $props.id();

	let dialog = $state<HTMLDialogElement>();

	/** Whether the dialog shows: the panel is open, on a screen that shows. */
	const shown = $derived(open && currentWindow.fit === 'screen');

	// The dialog follows `shown`, once what it holds is in the page: the first thing that takes
	// the keys, the cross, gets the focus.
	$effect(() => {
		if (!dialog) return;
		if (!shown) dialog.close();
		else if (!dialog.open) dialog.showModal();
	});

	/** Whether the pointer went down on the veil itself: a click counts only from there. */
	let pressedVeil = false;

	/**
	 * A click on the veil closes the panel. A press that starts in the panel and ends on the veil
	 * is a click of the veil for the browser: it closes nothing. Nor does the second click of a
	 * double click on what opened the panel, which lands on the veil that covers it by then.
	 */
	function onclick(event: MouseEvent) {
		if (event.detail > 1) return;
		if (pressedVeil && event.target === event.currentTarget) open = false;
	}

	/**
	 * The browser says that the dialog has closed, a moment after it did, whatever closed it. A
	 * panel opened again in that moment stays open, and so does one whose dialog closed with the
	 * screen, under the message of a window too small.
	 */
	function onclose() {
		if (!dialog?.open && shown) open = false;
	}
</script>

<!-- Escape closes the dialog by itself: the panel closes with it at once, not a moment later
     when the browser says so. -->
<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	onpointerdown={(event) => (pressedVeil = event.target === event.currentTarget)}
	{onclick}
	oncancel={() => (open = false)}
	{onclose}
>
	{#if open}
		<div class="panel" style:width="{width}px">
			<h2 id="{id}-title">{title}</h2>
			<button
				type="button"
				class="close"
				title={t('panel-close')}
				aria-label={t('panel-close')}
				onclick={() => (open = false)}
			>
				<Icon name="close" size={16} />
			</button>
			{@render children()}
		</div>
	{/if}
</dialog>

<style>
	/* The veil: the dialog itself, over the whole window, so that a click on it is a click
	   outside the panel. The browser draws a backdrop of its own behind it, left empty. */
	dialog {
		box-sizing: border-box;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: var(--veil);
		color: var(--text);
	}

	/* Only while it is open: a `display` written for the dialog would show it closed too. */
	dialog[open] {
		display: grid;
		place-items: center;
	}

	dialog::backdrop {
		background: none;
	}

	/* The sides of a panel; what it holds gives the room under it. */
	.panel {
		position: relative;
		box-sizing: border-box;
		padding: var(--space-16) var(--space-24) 0;
		border: var(--pop-border);
		background: var(--pop);
		box-shadow: var(--pop-shadow);
	}

	h2 {
		margin: 0;
		font: var(--weight-strong) var(--size-title) / var(--line-title) var(--font-text);
	}

	/* The cross stands at the same distance from the top and the right borders. */
	.close {
		position: absolute;
		top: var(--space-6);
		right: var(--space-6);
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: none;
		color: var(--weak);
	}

	.close:hover {
		background: var(--hover);
		color: var(--text);
	}
</style>
