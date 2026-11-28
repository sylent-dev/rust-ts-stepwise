<!-- The level screen, and the sandbox, the level screen without goal (see Level screen in
     specs.md): under its header, the code on the left on the whole height, the map on top on the
     right, the console and the variables under it. The blocks meet without any line, each zone in
     its own tone. A route gives it what it plays on, and it wires the rest:
     the same for a level and for the sandbox. The code of each level is saved as the learner
     changes it, with its breakpoints, and comes back with the level, until **Restore starting
     code** puts the level back in its first state (see Code editor in specs.md). **Run** plays that
     code on the map shown, at the speed of the settings, which **Run › Speed** chooses (see Running
     a program in specs.md), and pauses it on its breakpoints; the editor lights the line of its
     next step, and marks the line where an error stopped it, and its three controls stand in the
     corner of the code. The status bar, under the code, says where the program stands, in the color
     of its state. The console shows the log of the last **Run**: what the program printed and the
     error that stopped it, or the errors that kept it from starting, a click on one putting the
     cursor at its place. The variables panel shows the calls of the program and their variables;
     its tab opens by itself at a pause (see Variables panel in specs.md). **Help › Keyboard
     shortcuts** lists the shortcuts of the screen in a
     panel. A run plays its sounds while the setting **Sounds** is on (see Sounds in specs.md).
     A level of more than one map shows a tab per map above it; showing another map ends the
     program as **Reset** does, the console kept. Once a program of a level has ended, the console
     says how its goals went, and a map passed is kept in the progress, its tab teal while the code
     is the one that passed it (see Variants in specs.md). The header of a level names its chapter
     and its number, draws the bar of the progress, and its menu **Level** leads to the levels
     beside it while they are open. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { differsFromStart, type LevelCode } from '#lib/code/code.ts';
	import { CommandMenu } from '#lib/command-menu/command-menu.svelte.ts';
	import { ConsoleLog } from '#lib/console/console-log.svelte.ts';
	import { keepCode, openingCode, restoreCode } from '#lib/code/current-code.ts';
	import type { Outcome } from '#lib/core/core.ts';
	import { kept } from '#lib/core/core-ready.svelte.ts';
	import CodeEditor from '#lib/editor/code-editor.svelte';
	import type { CodeChange, Editing } from '#lib/editor/edits.ts';
	import { errorText } from '#lib/errors/error-text.ts';
	import { t } from '#lib/i18n.ts';
	import { loadFailed } from '#lib/page/startup.svelte.ts';
	import { currentPlatform } from '#lib/platform.ts';
	import { keepPass, levelProgress } from '#lib/progress/current-progress.svelte.ts';
	import { mapsPassedWith, mapToTry } from '#lib/progress/progress.ts';
	import { chooseSpeed, settings } from '#lib/settings/current-settings.svelte.ts';
	import SettingsButton from '#lib/settings/settings-button.svelte';
	import Confirmation from '#lib/shell/confirmation.svelte';
	import { currentScreen } from '#lib/shell/current-screen.svelte.ts';
	import Header from '#lib/shell/header.svelte';
	import MenuBar from '#lib/shell/menu-bar.svelte';
	import Place from '#lib/shell/place.svelte';
	import ScreenShortcuts from '#lib/shell/screen-shortcuts.svelte';
	import ShortcutsPanel from '#lib/shell/shortcuts-panel.svelte';
	import { pageSounds } from '#lib/sounds/page-sounds.ts';
	import { levelCommands, type Side } from './level-commands.ts';
	import { levelMenus, type LevelScreenKind } from './level-menus.ts';
	import { goalNotes, passedNote } from './level-notes.ts';
	import { levelShortcuts } from './level-shortcuts.ts';
	import { LockFlash } from './lock-flash.svelte.ts';
	import MapBlock from './map-block.svelte';
	import MapTabs from './map-tabs.svelte';
	import { PanelTabs } from './panel-tabs.svelte.ts';
	import Panels from './panels.svelte';
	import type { Playground } from './playground.ts';
	import { Program, type ProgramSounds } from './program.ts';
	import RunControls from './run-controls.svelte';
	import type { SpeedSetting } from './speeds.ts';
	import { statusState } from './status.ts';
	import StatusBar from './status-bar.svelte';

	/** A level has a number, the sandbox none. */
	type Props = {
		/** Which screen it is: its menus, and the mark of the sandbox in its header. */
		screen: LevelScreenKind;
		/** The place of the screen, in its header: the title of the level, or the sandbox. */
		title: string;
		/** What the screen plays on; nothing until the core is ready. */
		playground?: Playground;
		/** Shows another map of the level, by its number, which its tab names. */
		onchoosemap?: (map: number) => void;
	} & (
		| {
				screen: 'level';
				/** The number of the level, before its title where a sentence names it. */
				number: number;
				/** The title of its chapter, above its own in the header. */
				chapter: string;
				/** The levels done, and how many there are: the bar of the progress. */
				progress: { done: number; total: number };
				/** The numbers of the levels before and after it, while they are open. */
				beside: Partial<Record<Side, number>>;
		  }
		| {
				screen: 'sandbox';
				number?: undefined;
				chapter?: undefined;
				progress?: undefined;
				beside?: undefined;
		  }
	);

	let { screen, title, playground, onchoosemap, number, chapter, progress, beside }: Props =
		$props();

	/** The stable name of the level shown, or of the sandbox; nothing until the core is ready. */
	const shownName = $derived(playground?.name);

	/**
	 * The console of the level shown, which the programs of its maps write: showing another map
	 * keeps what it says, and another level starts it anew.
	 */
	const log = $derived(shownName === undefined ? undefined : new ConsoleLog());

	/** The editor shown; nothing until the core is ready. */
	let editing = $state.raw<Editing>();

	/** Which of the console and the variables the panels under the map show, below 1,600 pixels. */
	const tabs = new PanelTabs();

	/**
	 * The lines of the breakpoints of the code shown, which the program reads at each of its
	 * frames: a breakpoint set while it runs pauses it at once.
	 */
	const breakpointLines = $derived(new Set(editing?.breakpoints));

	/**
	 * The sounds of the programs, while the setting **Sounds** is on, read at each sound: turned
	 * off in the settings, or in another tab, nothing more plays (and the layout stops what still
	 * plays). `stop` reads no signal, since a cleanup calls it.
	 */
	const sounds: ProgramSounds = {
		wake() {
			if (settings.sounds) pageSounds.wake();
		},
		play({ sound, delay }) {
			if (settings.sounds) pageSounds.play(sound, delay);
		},
		stop() {
			pageSounds.stop();
		}
	};

	/**
	 * The program of the screen: the code of the editor, played on the map shown. A program of
	 * its own for each map, made with it, so that the map never draws the program of another
	 * one, and freed with its run once another one has taken its place or the screen closes; at
	 * rest until **Run** or **Step**. It reads the speed of the settings at each of its frames,
	 * so a speed chosen while it runs is followed at once. An error of the bridge while it runs
	 * is one that the application didn't foresee: the page says it, in place of the screen (see
	 * Error handling in specs.md).
	 */
	const program = kept(() => {
		const ground = playground;
		// Made out of the reach of the signals: only another map makes another program.
		return (
			ground &&
			untrack(
				() =>
					new Program(ground, () => editing?.text, {
						log,
						rate: () => settings.speed,
						breakpoints: () => breakpointLines,
						onStart: () => {
							editing?.settleBreakpoints();
							tabs.started();
						},
						onListed: () => {
							tabs.listed();
						},
						onStopped: (outcome, code) => {
							ended(ground, outcome, code);
						},
						onBroken: loadFailed,
						sounds
					})
			)
		);
	});

	/**
	 * Whether the last map passed has done the level, every map passed with its code: decided as
	 * the program ends, as the console says it, so that the status bar says the same. The bar reads
	 * it only for a map passed, which comes with it.
	 */
	let levelDone = $state(false);

	/**
	 * A program of a map of a level has ended, without error: the console says how its goals
	 * went, and a map passed is kept in the progress. The sandbox has no goal.
	 */
	function ended(ground: Playground, outcome: Outcome, code: string) {
		const { name, mapNumber, mapCount } = ground;
		if (mapNumber === undefined || mapCount === undefined) return;
		switch (outcome.type) {
			case 'goals-not-met':
				log?.note(goalNotes(outcome.goals));
				break;
			case 'passed': {
				const passed = mapsPassedWith(keepPass(name, mapNumber, code, mapCount), code);
				levelDone = mapToTry(passed, mapCount) === undefined;
				log?.note([passedNote(mapNumber, mapCount, passed)]);
				break;
			}
			case 'ended':
			case 'failed':
				break;
		}
	}

	/** The maps that the code as it is now has passed, whose tabs are teal. */
	const passedMaps = $derived(
		playground && editing
			? mapsPassedWith(levelProgress(playground.name), editing.text)
			: new Set<number>()
	);

	const id = $props.id();

	/** The id of the block of the map, which the tabs of the maps show. */
	const mapPanel = `${id}-map`;

	/** The tabs of the maps of a level of more than one map: how many, and the one shown. */
	const mapTabs = $derived(
		playground?.mapNumber !== undefined &&
			playground.mapCount !== undefined &&
			playground.mapCount > 1
			? { count: playground.mapCount, shown: playground.mapNumber }
			: undefined
	);

	/** The speed of the programs: a setting, which the menu **Run** reads and chooses. */
	const speed: SpeedSetting = {
		get current() {
			return settings.speed;
		},
		choose: chooseSpeed
	};

	// The tabs under the map follow the program: a pause shows the variables, an error the console.
	$effect(() => {
		const status = program.current?.status;
		if (status) untrack(() => tabs.follow(status));
	});

	// A run is paused while a message takes the place of the screen, and stays so once the screen
	// is back (see Error handling in specs.md).
	$effect(() => {
		if (!currentScreen.shows) program.current?.pause();
	});

	/**
	 * The line where an error stopped the program, once the robot has shown it; nothing until
	 * the next **Run** or **Reset**, nor for a program that ended without error.
	 */
	const failedLine = $derived.by(() => {
		const outcome = program.current?.played.outcome;
		return outcome?.type === 'failed' ? outcome.error.span.line : undefined;
	});

	/**
	 * Whether the learner is typing in the code: the controls grow pale, until the mouse moves,
	 * the keyboard reaches one of them, or the program starts, whose code no one types in. A
	 * mouse that stays still gives no movement: a browser may tell that it moved when the code
	 * scrolls under it, as it does while the learner types.
	 */
	let typing = $state(false);

	function onpointermove(event: PointerEvent) {
		if (event.movementX !== 0 || event.movementY !== 0) typing = false;
	}

	/**
	 * The flash of the status bar, when the learner tries to change the code while it is locked:
	 * it ends once the code is free again, so that its reason never shows over a code that can
	 * be changed.
	 */
	const lockFlash = new LockFlash();

	$effect(() => {
		if (program.current?.locked) typing = false;
		else lockFlash.end();
	});

	/** What the status bar says of the program of the map shown. */
	const status = $derived.by(() => {
		const current = program.current;
		return statusState(
			current && {
				status: current.status,
				line: current.played.line,
				atBreakpoint: current.played.atBreakpoint,
				outcome: current.played.outcome
			},
			playground?.mapNumber,
			levelDone
		);
	});

	/** Whether the confirmation of **Restore starting code** shows. */
	let restoring = $state(false);

	/**
	 * Whether the panel of the keyboard shortcuts shows. A program keeps running under it, as
	 * under the settings: only the shortcuts of the screen go silent.
	 */
	let showingShortcuts = $state(false);

	/**
	 * The code of the level shown, as the editor holds it, with its breakpoints: what is saved,
	 * and what is compared with the starting code. Nothing while the screen has no editor.
	 */
	function shownCode(): LevelCode | undefined {
		return editing && { text: editing.text, breakpoints: editing.breakpoints };
	}

	/** The command menu, in the editor of the level shown. */
	const commandMenu = new CommandMenu();

	/**
	 * Whether the code of the next level shown takes the keyboard once its editor is there: the
	 * menu **Level** leads to it, and gives the keyboard back to the code, as any row does.
	 */
	let focusNextCode = false;

	/** Opens the level on `side` of the one shown, while it is open. */
	function goTo(side: Side) {
		const to = beside?.[side];
		if (to === undefined) return;
		focusNextCode = true;
		void goto(resolve(`levels/${String(to)}`));
	}

	// The editor of the level that the menu **Level** opened takes the keyboard, once there.
	$effect(() => {
		if (editing && focusNextCode) {
			focusNextCode = false;
			editing.focus();
		}
	});

	/** The commands of the screen: the rows of its menus run them, and its shortcuts. */
	const commands = levelCommands(
		{
			canGoTo: (side) => beside?.[side] !== undefined,
			goTo,
			editing: () => editing,
			canRestore: () => {
				const code = shownCode();
				return (
					code !== undefined &&
					playground !== undefined &&
					differsFromStart(code, playground.startingCode)
				);
			},
			confirmRestore: () => {
				restoring = true;
			},
			program: () => program.current,
			showShortcuts: () => {
				showingShortcuts = true;
			},
			canOpenCommands: () => editing !== undefined && program.current?.locked !== true,
			toggleCommands: () => {
				commandMenu.toggle();
			}
		},
		currentPlatform()
	);

	/** Keeps the code of the level shown, with its breakpoints, as it is now. */
	function keepShown() {
		const code = shownCode();
		if (playground && code) keepCode(playground.name, code);
	}

	/**
	 * Keeps the code of the level shown, at each change that the learner makes to it, and the
	 * errors that the console lists at their places in it.
	 */
	function onchange(change: CodeChange) {
		keepShown();
		program.current?.follow(change);
	}

	/**
	 * Puts the level shown back in its first state, once the learner has confirmed: its program
	 * ends, as by **Reset**, its code is forgotten, and the editor opens again on its starting
	 * code, without breakpoints and with nothing to undo. The console forgets what it said of the
	 * code that is gone.
	 */
	function restore() {
		if (!playground) return;
		program.current?.restore();
		restoreCode(playground.name);
		editing?.reopen(playground.startingCode);
	}

	/** What the confirmation asks: a level is named by its number and its title. */
	const restoreQuestion = $derived(
		number === undefined
			? t('restore-question-sandbox')
			: t('restore-question-level', { level: t('screen-level', { number, title }) })
	);

	/** What the confirmation says is lost. */
	const restoreLost = $derived(
		number === undefined ? t('restore-lost-sandbox') : t('restore-lost-level')
	);
</script>

<ScreenShortcuts commands={Object.values(commands)} />
<svelte:window {onpointermove} />
<div class="level-screen" class:with-progress={progress !== undefined}>
	<Header {progress}>
		<MenuBar menus={levelMenus(screen, commands, speed)} />
		<!-- The diamond is the mark of the sandbox. -->
		<Place {title} {chapter} {number} icon={screen === 'sandbox' ? 'diamond' : undefined} />
		<SettingsButton gear />
	</Header>
	<main>
		<div class="code">
			<div class="editor-zone">
				{#if playground}
					<!-- One editor per level, whichever of its maps is shown: the code belongs to the
					     level, which its name tells from the others. It opens on the code saved for
					     the level and its breakpoints, read once as the editor is made. Its code can't
					     be changed while its program runs or is paused; its breakpoints can. -->
					{#key playground.name}
						{@const opening = openingCode(playground.name, playground.startingCode)}
						<!-- Room under the last line for the controls, and as much again above them. -->
						<CodeEditor
							--below="calc(var(--control-side) + 2 * var(--space-12))"
							text={opening.text}
							breakpoints={opening.breakpoints}
							explain={errorText}
							parts={commandMenu.parts()}
							locked={program.current?.locked}
							next={program.current?.played.line}
							failed={failedLine}
							bind:editing
							{onchange}
							onbreakpoints={keepShown}
							ontype={() => (typing = true)}
							onrefuse={() => {
								lockFlash.refuse();
							}}
						/>
					{/key}
					<!-- A click on a control keeps the focus where it was: only the keyboard brings
					     it there. -->
					<div class="corner" onfocusin={() => (typing = false)}>
						<RunControls {commands} action={program.current?.action ?? 'run'} pale={typing} />
					</div>
				{/if}
			</div>
			<StatusBar
				{status}
				errors={editing?.errors ?? 0}
				steps={program.current?.played.steps ?? 0}
				{speed}
				cursor={editing?.cursor}
				flash={lockFlash}
				onerrors={() => program.current?.listErrors()}
			/>
		</div>
		<div class="map">
			{#if mapTabs}
				<MapTabs
					count={mapTabs.count}
					shown={mapTabs.shown}
					passed={passedMaps}
					panel={mapPanel}
					onchoose={(map: number) => onchoosemap?.(map)}
				/>
			{/if}
			<MapBlock
				scene={program.current?.played}
				goals={playground?.goals}
				id={mapPanel}
				tab={mapTabs && `${mapPanel}-tab-${String(mapTabs.shown)}`}
			/>
		</div>
		<div class="panels">
			<Panels
				{tabs}
				{log}
				calls={program.current?.played.calls}
				onshow={(at: number) => editing?.showPlace(at)}
				onchoose={(index: number) => program.current?.showCall(index)}
			/>
		</div>
	</main>
</div>
<Confirmation
	bind:open={restoring}
	question={restoreQuestion}
	lost={restoreLost}
	action={t('restore-action')}
	onconfirm={restore}
/>
<ShortcutsPanel
	bind:open={showingShortcuts}
	title={commands['keyboard-shortcuts'].label}
	columns={levelShortcuts(commands)}
/>

<style>
	/* The crossing of the two columns: the code takes half the window and stops growing at about
	   80 characters, two fifths of a screen of 1920 pixels. The place of the level stays above
	   it, in the header (shell/place.svelte). The screen has no box of its own: the body lays out
	   its header and its main block (styles/base.css). */
	.level-screen {
		display: contents;
		--crossing: min(50%, 768px);
		--header: var(--header-height);
	}

	/* A level draws the bar of the progress, which makes its header taller. */
	.with-progress {
		--header: calc(var(--header-height) + var(--progress-height));
	}

	/* The panels are 216 pixels high, 250 from 1600 pixels wide, where they stand side by side,
	   as in the mock-up. The map takes the height of the window left under the header, and keeps
	   it under the banner of a browser that refuses to save: the panels give the banner its
	   height (see Error handling in specs.md). */
	main {
		--panels: 216px;
		--map-row: calc(100vh - var(--header) - var(--panels));
		display: grid;
		grid-template-columns: var(--crossing) minmax(0, 1fr);
		grid-template-rows: minmax(0, var(--map-row)) minmax(0, 1fr);
	}

	@media (min-width: 1600px) {
		main {
			--panels: 250px;
		}
	}

	/* The code on the whole height, its status bar under it. What opens from the code, the tip
	   of an error or the command menu, stands over the map and the panels beside it, which come
	   later in the page. */
	.code {
		position: relative;
		z-index: var(--layer-code);
		display: flex;
		flex-direction: column;
		grid-row: 1 / 3;
		min-width: 0;
		min-height: 0;
		background: var(--surface);
	}

	/* The editor scrolls its code by itself; the controls float in its corner, and don't scroll
	   with it. */
	.editor-zone {
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.corner {
		position: absolute;
		right: var(--space-12);
		bottom: var(--space-12);
	}

	.map {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.panels {
		min-height: 0;
		background: var(--band);
	}
</style>
