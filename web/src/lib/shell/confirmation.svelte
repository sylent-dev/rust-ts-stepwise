<!-- A confirmation (see Code editor in specs.md): a small panel in the middle of the screen, over
     a veil, which asks before an action that can't be undone, as **Restore starting code**. The
     question is its title; under it, what is lost for good; then **Cancel** and the action, the
     main button, red since it can't be undone. The action holds the focus as the panel opens, so
     Enter confirms, once let go, and Escape cancels, as everywhere; a key held down since the row
     that opened it confirms nothing. It has no ×: **Cancel** says it. A screen reader announces it as an
     alert, and reads what is lost. -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import Panel from './panel.svelte';

	interface Props {
		/** Whether it shows. It closes itself, and says so here. */
		open: boolean;
		/** What it asks, as a question: its title. */
		question: string;
		/** What is lost for good, in a sentence. */
		lost: string;
		/** The text of the button that acts: what it does, without `…`. */
		action: string;
		/** Does what the learner confirmed; the panel closes once it is done. */
		onconfirm: () => void;
	}

	let { open = $bindable(), question, lost, action, onconfirm }: Props = $props();

	const id = $props.id();

	function confirm() {
		onconfirm();
		open = false;
	}

	/**
	 * Whether Enter went down on the action since it got the focus. A key held down repeats, and
	 * its repeats follow the focus: Enter held on the row of a menu would reach the action, which
	 * has the focus as soon as the panel opens, and confirm; Enter that confirms at once, then
	 * stays down, would type its repeats in the code, which gets the focus back. So Enter
	 * confirms once let go, as Space does, and only after it went down on the action itself.
	 * (Whether a key held down runs a command again is a question of step 17 for every command;
	 * here, what can't be undone answers it.)
	 */
	let pressed = false;

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			// The browser would confirm at once, at this press.
			event.preventDefault();
			if (!event.repeat) pressed = true;
		} else if (event.key === ' ' && event.repeat) {
			// Space confirms once let go, after a press that went down on the action.
			event.preventDefault();
		}
	}

	function onkeyup(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !pressed) return;
		pressed = false;
		confirm();
	}
</script>

<Panel title={question} bind:open width={440} cross={false} describedby="{id}-lost" alert>
	<p id="{id}-lost">{lost}</p>
	<div class="buttons">
		<button type="button" class="button" onclick={() => (open = false)}>
			{t('panel-cancel')}
		</button>
		<!-- The browser gives the focus of a panel that opens to the button that asks for it
		     (`autofocus`), here the action: Enter confirms (see Code editor in specs.md). A click
		     confirms too: the mouse, Space, a screen reader. -->
		<!-- svelte-ignore a11y_autofocus (the focus moves into a panel that the learner just opened, never into a page that loads) -->
		<button
			type="button"
			class="button is-danger"
			autofocus
			onfocus={() => (pressed = false)}
			{onkeydown}
			{onkeyup}
			onclick={confirm}
		>
			{action}
		</button>
	</div>
</Panel>

<style>
	p {
		margin: var(--space-8) 0 0;
		color: var(--weak);
	}

	/* The two buttons at the right end, the action last; the panel gives no room under them. */
	.buttons {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-8);
		margin-top: var(--space-16);
		padding-bottom: var(--space-24);
	}
</style>
