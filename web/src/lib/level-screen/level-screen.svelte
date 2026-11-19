<!-- The level screen, and the sandbox, the level screen without goal (see Level screen in
     specs.md): under its header, the code on the left on the whole height, the map on top on the
     right, the console and the variables under it. The blocks meet without any line, each zone in
     its own tone; the panels come with the running (step 17). A route gives it what it plays on,
     and it wires the rest: the same for a level and for the sandbox. -->
<script lang="ts">
	import Bench from '#lib/bench/bench.svelte';
	import { levelMenus, type LevelScreenKind } from '#lib/level-menus.ts';
	import type { Scene } from '#lib/map/scene.ts';
	import type { Playback } from '#lib/playback.svelte.ts';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';
	import MapBlock from './map-block.svelte';
	import type { Playground } from './playground.ts';

	interface Props {
		/** Which screen it is: its menus, and the mark of the sandbox in its header. */
		screen: LevelScreenKind;
		/** The place of the screen, in its header: the title of the level, or the sandbox. */
		title: string;
		/** What the screen plays on; nothing until the core is ready. */
		playground?: Playground;
	}

	let { screen, title, playground }: Props = $props();

	/** The program played on the map. */
	let playback = $state.raw<Playback>();

	/** What the map draws: the program played, or the world at rest before any program. */
	const scene = $derived<Scene | undefined>(playback ?? playground);
</script>

<div class="level-screen">
	<Header>
		<MenuBar menus={levelMenus(screen)} />
		<!-- The diamond is the mark of the sandbox. -->
		<Place {title} icon={screen === 'sandbox' ? 'diamond' : undefined} />
		<SettingsButton gear />
	</Header>
	<main>
		<!-- Until the editor (step 16) and the running (step 17), the column of the code holds the
		     bench of the animations: short programs played by the core on the map of the screen. A
		     bench of its own for each map, whose runs start on it. -->
		<div class="code">
			{#if playground}
				{#key playground}
					<Bench {playground} bind:playback />
				{/key}
			{/if}
		</div>
		<div class="map"><MapBlock {scene} goals={playground?.goals} /></div>
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
