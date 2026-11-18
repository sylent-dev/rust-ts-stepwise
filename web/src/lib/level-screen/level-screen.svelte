<!-- The level screen, and the sandbox, the level screen without goal (see Level screen in
     specs.md): under its header, the code on the left on the whole height, the map on top on the
     right, the console and the variables under it. The blocks meet without any line, each zone in
     its own tone; the panels come with the running (step 17). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The header of the screen. */
		header: Snippet;
		/** The column of the code. */
		code?: Snippet;
		/** The block of the map. */
		map: Snippet;
	}

	let { header, code, map }: Props = $props();
</script>

<div class="level-screen">
	{@render header()}
	<main>
		<div class="code">{@render code?.()}</div>
		<div class="map">{@render map()}</div>
		<div class="panels"></div>
	</main>
</div>

<style>
	/* The crossing of the two columns: the code takes half the window and stops growing at about
	   80 characters, two fifths of a screen of 1920 pixels. The place of the level stays above
	   it, in the header (shell/place.svelte). The screen has no box of its own: the body lays out
	   its header and its main block (styles/base.css). */
	.level-screen {
		display: contents;
		--crossing: min(50%, 768px);
	}

	/* The panels are 216 pixels high, 250 from 1600 pixels wide, where they stand side by side,
	   as in the mock-up. The map takes the height of the window left under the header, and keeps
	   it under the banner of a browser that refuses to save: the panels give the banner its
	   height (see Error handling in specs.md). */
	main {
		--panels: 216px;
		--map-row: calc(100vh - var(--header-height) - var(--panels));
		display: grid;
		grid-template-columns: var(--crossing) minmax(0, 1fr);
		grid-template-rows: minmax(0, var(--map-row)) minmax(0, 1fr);
	}

	@media (min-width: 1600px) {
		main {
			--panels: 250px;
		}
	}

	.code {
		grid-row: 1 / 3;
		min-width: 0;
		overflow: auto;
		background: var(--surface);
	}

	.map {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.panels {
		background: var(--band);
	}
</style>
