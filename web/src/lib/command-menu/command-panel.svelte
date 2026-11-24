<!-- The panel of the command menu (see Command menu in specs.md; mock-up: section Command menu of
     docs/mockups/interface.html): one fixed panel of three columns, which never changes its shape
     while the learner moves in it: the categories, always in view; the words of the category
     chosen, or every word that the letters typed keep, under the name of its category; the details
     of the word chosen. When nothing matches, the disappointed robot takes the place of the words
     and of their details. A line at the bottom recalls the keys.

     The keyboard stays in the code, which writes the letters typed and gives the keys of the menu
     to it (editor-menu.ts): a press on the panel never takes the focus. -->
<script lang="ts">
	import { logoDisappointed } from '#lib/elements.ts';
	import { t } from '#lib/i18n.ts';
	import Icon from '#lib/icon.svelte';
	import { keyMessage } from '#lib/shell/commands.ts';
	import { codePieces, textPieces } from './code-text.ts';
	import { optionId } from './editor-menu.ts';
	import type { MenuView } from './results.ts';
	import { type Category, categoryMessage, type MenuEntry, wordMessage } from './words.ts';

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

	/** Nothing matches the letters typed: the robot and its sentence take the place of the words. */
	const nothing = $derived(view.chosen === undefined && view.letters !== '');

	let list = $state<HTMLElement>();

	// The list scrolls to keep the word chosen in view, as the arrows move it.
	$effect(() => {
		const chosen = view.chosen;
		if (!chosen || !list) return;
		list.querySelector(`#${CSS.escape(optionId(listId, chosen.word))}`)?.scrollIntoView({
			block: 'nearest'
		});
	});
</script>

<!-- A press keeps the focus where it is: in the code. -->
<div class="panel" role="presentation" onmousedown={(event) => event.preventDefault()}>
	<div class="columns" class:merged={nothing}>
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
		{#if nothing}
			<div class="empty">
				<img src={logoDisappointed} alt="" height="56" />
				<span>{t('commands-empty', { letters: view.letters })}</span>
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
						<div class="title" role="presentation">{t(categoryMessage(group.category))}</div>
					{/if}
					{#each group.entries as entry (entry.word)}
						<!-- svelte-ignore a11y_click_events_have_key_events (the keys of the menu are heard by the code, which keeps the focus) -->
						<div
							class="row"
							class:chosen={entry === view.chosen}
							id={optionId(listId, entry.word)}
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
				{/each}
			</div>
			<div class="details">
				{#if view.chosen}
					{@const word = view.chosen.word}
					<div class="name">{view.chosen.label}</div>
					<!-- Without a space between two pieces: each holds its own. -->
					<p>
						{#each textPieces(t(wordMessage(word, 'text'))) as piece, index (index)}{#if piece.code}<code
									>{piece.text}</code
								>{:else}{piece.text}{/if}{/each}
					</p>
					<code class="example"
						>{#each t(wordMessage(word, 'example')).split('\n') as line, index (index)}<span
								class="line"
								>{#each codePieces(line) as piece, at (at)}<span class={piece.color}
										>{piece.text}</span
									>{/each}</span
							>{/each}</code
					>
				{/if}
			</div>
		{/if}
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

	/* Nothing found: the robot and its sentence take the place of the words and of their details. */
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

	.row {
		padding: var(--space-2) var(--space-12);
		white-space: nowrap;
		cursor: pointer;
	}

	.row.chosen {
		background: var(--chosen);
		color: var(--on-chosen);
	}

	/* Nothing found: the robot and its sentence in the middle of the whole space. */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-12);
		color: var(--weak);
	}

	.details {
		padding: var(--space-12);
		overflow: hidden;
		background: var(--band);
	}

	.name {
		font: var(--weight-code-strong) var(--size-code) var(--font-code);
		font-variant-ligatures: none;
	}

	.details p {
		margin: var(--space-8) 0;
		line-height: var(--line-text);
	}

	/* Code in a sentence (see Code in a message in docs/design-system.md). */
	.details p code {
		font: var(--weight-code) 0.92em var(--font-code);
		font-variant-ligatures: none;
	}

	.example {
		display: block;
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius);
		background: var(--surface);
		font: var(--weight-code) var(--size-code-small) / var(--line-code-small) var(--font-code);
		font-variant-ligatures: none;
	}

	/* Each line of the example as it is written, its spaces kept. */
	.line {
		display: block;
		white-space: pre;
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
