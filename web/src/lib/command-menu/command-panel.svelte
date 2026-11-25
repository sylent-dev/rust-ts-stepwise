<!-- The panel of the command menu (see Command menu in specs.md; mock-up: section Command menu of
     docs/mockups/interface.html): one fixed panel of three columns, which never changes its shape
     while the learner moves in it: the categories, always in view; the words of the category
     chosen, or every word that the letters typed keep, under the name of its category; the details
     of the word chosen. When nothing matches, the disappointed robot takes the place of the words
     and of their details; when Your names has no name, a sentence alone, since nothing went
     wrong. A line at the bottom recalls the keys.

     The keyboard stays in the code, which writes the letters typed and gives the keys of the menu
     to it (editor-menu.ts): a press on the panel never takes the focus. -->
<script lang="ts">
	import { logoDisappointed } from '#lib/elements.ts';
	import { t } from '#lib/i18n.ts';
	import Icon from '#lib/icon.svelte';
	import { keyMessage } from '#lib/shell/commands.ts';
	import { optionId } from './editor-menu.ts';
	import EntryDetails from './entry-details.svelte';
	import type { EmptyMenu, MenuView } from './results.ts';
	import { type Category, categoryMessage, type MenuEntry } from './words.ts';

	interface Props {
		/** What the menu shows. */
		view: MenuView;
		/** The id of the list of the words, which the code names to a screen reader. */
		listId: string;
		/** The pointer moved over a word: it becomes the word chosen. */
		onpoint: (entry: MenuEntry) => void;
		/** A word clicked: the menu inserts it. */
		onpick: (entry: MenuEntry) => void;
		/** A category clicked. */
		oncategory: (category: Category) => void;
	}

	let { view, listId, onpoint, onpick, oncategory }: Props = $props();

	/** What takes the place of the words and of their details, when there are none to show. */
	function sentenceOf(empty: EmptyMenu): string {
		switch (empty.kind) {
			case 'nothing-found':
				return t('commands-empty', { letters: view.letters });
			case 'no-names':
				return empty.hiddenBy === undefined
					? t('commands-names-none')
					: t('commands-names-hidden', { line: empty.hiddenBy });
		}
	}

	/** The sentence in place of the words and of their details, when there are none to show. */
	const sentence = $derived(view.empty && sentenceOf(view.empty));

	let list = $state<HTMLElement>();

	// The list scrolls to keep the word chosen in view, as the arrows move it.
	$effect(() => {
		const chosen = view.chosen;
		if (!chosen || !list) return;
		list.querySelector(`#${CSS.escape(optionId(listId, chosen))}`)?.scrollIntoView({
			block: 'nearest'
		});
	});
</script>

{#snippet rows(entries: readonly MenuEntry[])}
	{#each entries as entry (entry.text)}
		<!-- svelte-ignore a11y_click_events_have_key_events (the keys of the menu are heard by the code, which keeps the focus) -->
		<div
			class="row"
			class:chosen={entry === view.chosen}
			id={optionId(listId, entry)}
			role="option"
			tabindex="-1"
			aria-selected={entry === view.chosen}
			onpointermove={() => {
				if (entry !== view.chosen) onpoint(entry);
			}}
			onclick={() => {
				onpick(entry);
			}}
		>
			{entry.label}
		</div>
	{/each}
{/snippet}

<!-- A press keeps the focus where it is: in the code. -->
<div class="panel" role="presentation" onmousedown={(event) => event.preventDefault()}>
	<div class="columns" class:merged={sentence !== undefined}>
		<div class="categories">
			{#each view.categories as shown (shown.category)}
				<button
					type="button"
					tabindex="-1"
					class="category"
					class:chosen={shown.chosen}
					class:pale={shown.pale}
					onclick={() => {
						oncategory(shown.category);
					}}
				>
					<span>{t(categoryMessage(shown.category))}</span>
					{#if shown.count}
						<em>{shown.count}</em>
					{/if}
				</button>
			{/each}
		</div>
		{#if sentence !== undefined}
			<!-- The sentence is said by the status of the panel, under it. -->
			<div class="empty" aria-hidden="true">
				{#if view.empty?.kind === 'nothing-found'}
					<img src={logoDisappointed} alt="" height="56" />
				{/if}
				<span>{sentence}</span>
			</div>
		{:else}
			<div
				class="list"
				id={listId}
				role="listbox"
				aria-label={t('commands-list-name')}
				bind:this={list}
			>
				{#each view.groups as group (group.category)}
					{#if group.titled}
						<!-- While letters filter the words, the words of each category are a group, named
						     by its title. -->
						<div role="group" aria-labelledby={`${listId}-${group.category}`}>
							<div class="title" id={`${listId}-${group.category}`} role="presentation">
								{t(categoryMessage(group.category))}
							</div>
							{@render rows(group.entries)}
						</div>
					{:else}
						{@render rows(group.entries)}
					{/if}
				{/each}
			</div>
			<div class="details">
				{#if view.chosen}
					<EntryDetails entry={view.chosen} />
				{/if}
			</div>
		{/if}
	</div>
	<!-- What a screen reader is told when nothing matches, or when Your names has no name: a status
	     that the panel holds from its opening, so that the sentence is said as it comes. -->
	<div class="said" role="status">
		{sentence ?? ''}
	</div>
	<div class="keys" aria-hidden="true">
		<span>
			<kbd><Icon name="arrow-up" size={13} /> <Icon name="arrow-down" size={13} /></kbd>
			{t('commands-keys-move')}
		</span>
		<span>
			<kbd><Icon name="arrow-left" size={13} /> <Icon name="arrow-right" size={13} /></kbd>
			{t('commands-keys-category')}
		</span>
		<span>
			<kbd>{t(keyMessage('tab'))}</kbd>
			{t('commands-keys-or')}
			<kbd>{t(keyMessage('enter'))}</kbd>
			{t('commands-keys-insert')}
		</span>
		<span><kbd>{t(keyMessage('escape'))}</kbd> {t('commands-keys-close')}</span>
		<span>{t('commands-keys-search')}</span>
	</div>
</div>

<style>
	/* The size of the panel and of its two first columns are those of the mock-up: fixed, so that
	   nothing moves while the learner goes from a category to another. */
	.panel {
		display: flex;
		flex-direction: column;
		width: 630px;
		height: 306px;
		overflow: hidden;
		color: var(--text);
	}

	.columns {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 142px 202px 1fr;
	}

	/* Nothing to show: the sentence takes the place of the words and of their details. */
	.columns.merged {
		grid-template-columns: 142px 1fr;
	}

	.categories {
		display: flex;
		flex-direction: column;
		padding: var(--space-4) 0;
		background: var(--band);
	}

	.category {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-12);
		border: 0;
		background: none;
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.category.chosen {
		background: var(--chosen-soft);
		font-weight: var(--weight-strong);
	}

	/* A category without result while letters filter the words. The 40% is the one of the
	   mock-up, tuned by eye. */
	.category.pale {
		opacity: 0.4;
		cursor: default;
	}

	.category em {
		color: var(--weak);
		font: var(--weight-text) var(--size-small) var(--font-text);
	}

	.list {
		padding: var(--space-4) 0;
		overflow-y: auto;
		scrollbar-width: none;
		font: var(--weight-code) var(--size-code) / var(--line-code) var(--font-code);
		font-variant-ligatures: none;
	}

	.title {
		padding: var(--space-4) var(--space-12) var(--space-2);
		color: var(--weak);
		font: var(--weight-strong) var(--size-label) var(--font-text);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}

	/* A name of the program longer than the column ends with an ellipsis. */
	.row {
		padding: var(--space-2) var(--space-12);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.row.chosen {
		background: var(--chosen);
		color: var(--on-chosen);
	}

	/* Nothing to show: the sentence in the middle of the whole space, under the robot when nothing
	   matches the letters. */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-12);
		padding: 0 var(--space-40);
		color: var(--weak);
		text-align: center;
	}

	.details {
		padding: var(--space-12);
		overflow: hidden;
		background: var(--band);
	}

	/* Said, never shown: the size of one pixel, cut away, as a text for a screen reader alone. */
	.said {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.keys {
		flex: none;
		display: flex;
		gap: var(--space-16);
		align-items: center;
		height: 28px;
		padding: 0 var(--space-12);
		background: var(--band);
		color: var(--on-status);
		font-size: var(--size-small);
		white-space: nowrap;
	}

	/* The texts of the line sit one pixel low, tuned by eye in the mock-up. */
	.keys > span {
		position: relative;
		top: 1px;
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.keys kbd {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font: inherit;
		font-weight: var(--weight-strong);
	}
</style>
