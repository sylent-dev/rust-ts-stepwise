<!-- The shortcuts of a screen (see Level screen in specs.md): the one listener that hears them,
     on the whole window, so that a shortcut is the same wherever the keyboard is on the screen,
     in the code or not. A key that something took before it reaches the window is left to it.
     The screen hears nothing while it doesn't show, under a message in its place, nor under a
     panel, which keeps the keys. -->
<script lang="ts">
	import { currentPlatform } from '#lib/platform.ts';
	import { commandFor, type ScreenCommand } from './commands.ts';
	import { currentScreen } from './current-screen.svelte.ts';

	let { commands }: { commands: readonly ScreenCommand[] } = $props();

	const platform = currentPlatform();

	function onkeydown(event: KeyboardEvent) {
		// A key that writes an accent in two presses is still being typed.
		if (event.defaultPrevented || event.isComposing) return;
		const command = commandFor(event, commands, platform);
		if (!command || !currentScreen.shows) return;
		// A panel over the screen is the dialog of the browser, shown as a modal. The page is
		// asked for a shortcut alone, not at each key typed in the code.
		if (document.querySelector('dialog:modal')) return;
		// The shortcut of a command that can't run now stays ours: the browser does nothing else
		// with it.
		event.preventDefault();
		if (command.enabled) command.run();
	}
</script>

<svelte:window {onkeydown} />
