<!-- A shortcut beside its command (see Level screen in specs.md): its keys as this computer
     names them, a `+` between two of them, an arrow drawn as the one printed on its key. It is
     written for the eyes: what shows it gives the shortcut to a screen reader itself
     (`aria-keyshortcuts`, `spokenShortcut`). -->
<script lang="ts">
	import Icon from '#lib/icon.svelte';
	import { currentPlatform } from '#lib/platform.ts';
	import { keyParts, type Shortcut } from './commands.ts';

	let { shortcut }: { shortcut: Shortcut } = $props();

	const parts = $derived(keyParts(shortcut, currentPlatform()));
</script>

<!-- Each key and each `+` in an element of its own: a row lays them out side by side, and no
     space of this markup is drawn between two of them. -->
<kbd aria-hidden="true">
	{#each parts as part, index (index)}
		{#if index > 0}
			<span>+</span>
		{/if}
		{#if 'icon' in part}
			<Icon name={part.icon} size={13} />
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
</style>
