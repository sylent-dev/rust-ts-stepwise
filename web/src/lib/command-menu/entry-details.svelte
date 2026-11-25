<!-- The details of an entry of the command menu (see Command menu in specs.md): its name as the
     menu shows it, then, for a word, what it does in one sentence, whose code is in the font of the
     code, and an example; for a name of the program, what it is and the line where it is declared,
     then that line. Each line of code is colored as the editor colors it (code-text.ts), and a
     line longer than the details ends with an ellipsis. The manual will show its examples the same
     way (step 22). -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import { codePieces, textPieces } from './code-text.ts';
	import { type MenuEntry, wordMessage } from './words.ts';

	interface Props {
		entry: MenuEntry;
	}

	let { entry }: Props = $props();

	const text = $derived(entry.kind === 'word' ? t(wordMessage(entry.word, 'text')) : entry.about);
	const example = $derived(
		entry.kind === 'word' ? t(wordMessage(entry.word, 'example')) : entry.declaration
	);
</script>

<div class="name">{entry.label}</div>
<!-- Without a space between two pieces: each holds its own. -->
<p>
	{#each textPieces(text) as piece, index (index)}{#if piece.code}<code>{piece.text}</code
			>{:else}{piece.text}{/if}{/each}
</p>
<code class="example"
	>{#each example.split('\n') as line, index (index)}<span class="line"
			>{#each codePieces(line) as piece, at (at)}<span class={piece.color}>{piece.text}</span
				>{/each}</span
		>{/each}</code
>

<style>
	.name {
		overflow: hidden;
		font: var(--weight-code-strong) var(--size-code) var(--font-code);
		font-variant-ligatures: none;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	p {
		margin: var(--space-8) 0;
		line-height: var(--line-text);
	}

	/* Code in a sentence (see Code in a message in docs/design-system.md). */
	p code {
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
		overflow: hidden;
		white-space: pre;
		text-overflow: ellipsis;
	}
</style>
