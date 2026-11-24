<!-- The details of a word of the command menu (see Command menu in specs.md): its name as the menu
     shows it, what it does in one sentence, whose code is in the font of the code, and an example,
     each line colored as the editor colors it (code-text.ts). The manual will show its examples
     the same way (step 22). -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';
	import { codePieces, textPieces } from './code-text.ts';
	import { type MenuEntry, wordMessage } from './words.ts';

	interface Props {
		entry: MenuEntry;
	}

	let { entry }: Props = $props();
</script>

<div class="name">{entry.label}</div>
<!-- Without a space between two pieces: each holds its own. -->
<p>
	{#each textPieces(t(wordMessage(entry.word, 'text'))) as piece, index (index)}{#if piece.code}<code
				>{piece.text}</code
			>{:else}{piece.text}{/if}{/each}
</p>
<code class="example"
	>{#each t(wordMessage(entry.word, 'example')).split('\n') as line, index (index)}<span
			class="line"
			>{#each codePieces(line) as piece, at (at)}<span class={piece.color}>{piece.text}</span
				>{/each}</span
		>{/each}</code
>

<style>
	.name {
		font: var(--weight-code-strong) var(--size-code) var(--font-code);
		font-variant-ligatures: none;
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
		white-space: pre;
	}
</style>
