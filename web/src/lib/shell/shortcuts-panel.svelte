<!-- The panel of the keyboard shortcuts (see Level screen in specs.md): in the middle of the
     screen, over a veil, the shortcuts of the screen in groups, each title on a gray band, the
     groups in two columns. Escape, × or a click on the veil closes it (panel.svelte). Each row
     says what its keys do, then the keys, which a screen reader reads too. -->
<script lang="ts">
	import Panel from './panel.svelte';
	import ShortcutKeys from './shortcut-keys.svelte';
	import type { ShortcutColumns } from './shortcuts.ts';

	interface Props {
		/** Whether it shows. It closes itself, and says so here. */
		open: boolean;
		/** Its title: the text of the command that opens it. */
		title: string;
		columns: ShortcutColumns;
	}

	let { open = $bindable(), title, columns }: Props = $props();

	const id = $props.id();
</script>

<Panel {title} bind:open width={640}>
	<div class="columns">
		{#each columns as groups, column (column)}
			<div>
				{#each groups as group (group.id)}
					<section aria-labelledby="{id}-{group.id}">
						<h3 id="{id}-{group.id}">{group.title}</h3>
						<dl>
							{#each group.rows as row (row.id)}
								<div class="row">
									<dt>{row.label}</dt>
									<dd><ShortcutKeys shortcut={row.keys} spoken /></dd>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
			</div>
		{/each}
	</div>
</Panel>

<style>
	/* Under the title of the panel; the panel gives no room under its last row. */
	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0 var(--space-40);
		margin-top: var(--space-8);
		padding-bottom: var(--space-24);
	}

	/* Each title on a gray band, a little wider than its rows, so that the groups show at once. */
	h3 {
		margin: var(--space-12) calc(-1 * var(--space-8)) var(--space-6);
		padding: var(--space-4) var(--space-8);
		background: var(--hover);
		color: var(--weak);
		font: var(--weight-strong) var(--size-label) var(--font-text);
		text-transform: uppercase;
		letter-spacing: var(--tracking-label);
	}

	dl,
	dd {
		margin: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-16);
		padding: var(--space-4) 0;
	}
</style>
