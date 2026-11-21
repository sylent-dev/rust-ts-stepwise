<!-- A confirmation (see Code editor in specs.md): a small panel in the middle of the screen, over
     a veil, which asks before an action that can't be undone, as **Restore starting code**. The
     question is its title; under it, what is lost for good; then **Cancel** and the action, the
     main button, red since it can't be undone. The action holds the focus as the panel opens, so
     Enter confirms, and Escape cancels, as everywhere. It has no ×: **Cancel** says it. -->
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
</script>

<Panel title={question} bind:open width={440} cross={false} describedby="{id}-lost">
	<p id="{id}-lost">{lost}</p>
	<div class="buttons">
		<button type="button" class="button" onclick={() => (open = false)}>
			{t('panel-cancel')}
		</button>
		<!-- The browser gives the focus of a panel that opens to the button that asks for it
		     (`autofocus`), here the action: Enter confirms (see Code editor in specs.md). -->
		<!-- svelte-ignore a11y_autofocus (the focus moves into a panel that the learner just opened, never into a page that loads) -->
		<button type="button" class="button is-danger" autofocus onclick={confirm}>{action}</button>
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
