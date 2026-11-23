<!-- A shortcut beside its command (see Level screen in specs.md): its keys as this computer
     names them, a `+` between two of them, an arrow drawn as the one printed on its key. Beside a
     command, it is written for the eyes: what shows the command gives the shortcut to a screen
     reader itself (`aria-keyshortcuts`, `spokenShortcut`). In the panel of the shortcuts, where
     it is what a row says, a screen reader reads it, an arrow by its character, and keys pressed
     one after the other are a sentence (`Esc, then Tab`). -->
<script lang="ts">
	import Icon from '#lib/icon.svelte';
	import { currentPlatform } from '#lib/platform.ts';
	import { type KeyPart, keyParts, type Shortcut } from './commands.ts';

	interface Props {
		/** A shortcut, or keys pressed one after the other, written as a sentence. */
		shortcut: Shortcut | string;
		/** Whether a screen reader reads it: where nothing else tells it the shortcut. */
		spoken?: boolean;
	}

	let { shortcut, spoken = false }: Props = $props();

	const parts = $derived<KeyPart[]>(
		typeof shortcut === 'string' ? [{ text: shortcut }] : keyParts(shortcut, currentPlatform())
	);
</script>

<!-- Each key and each `+` in an element of its own: a row lays them out side by side, and no
     space of this markup is drawn between two of them. -->
<kbd aria-hidden={spoken ? undefined : 'true'}>
	{#each parts as part, index (index)}
		{#if index > 0}
			<span>+</span>
		{/if}
		{#if 'icon' in part}
			<span role="img" aria-label={part.spoken}><Icon name={part.icon} size={13} /></span>
		{:else}
			<span>{part.text}</span>
		{/if}
	{/each}
</kbd>

<style>
	/* What comes second beside its command, in the font of the interface: a shortcut isn't code. */
	kbd {
		display: flex;
		align-items: center;
		color: var(--weak);
		font: var(--weight-text) var(--size-small) var(--font-text);
		white-space: nowrap;
	}

	/* The drawing of an arrow, on the line of the letters beside it. */
	span[role='img'] {
		display: flex;
	}
</style>
