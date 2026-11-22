<!-- The three controls of the program, in the corner of the code (see Level screen in specs.md):
     **Run**, **Pause** or **Resume** in one button, then **Step** and **Reset**, each made of an
     icon that names itself with its shortcut, under the pointer or the keyboard, as its command
     says (level-commands.ts); **Reset** says what it keeps. They grow pale while the learner
     types, so that the code behind them is read, and come back as soon as the screen says so. A
     click leaves the keyboard where it was, the code most often, so that the learner goes on
     typing, as a row of a menu gives it back. The block that shows them places them. -->
<script lang="ts">
	import type { IconName } from '#lib/icon-name.ts';
	import { t } from '#lib/i18n.ts';
	import IconButton from '#lib/shell/icon-button.svelte';
	import type { LevelCommands } from './level-commands.ts';
	import type { RunAction } from './program.ts';

	interface Props {
		/** The commands of the screen, those of the program among them. */
		commands: Pick<LevelCommands, 'run' | 'step' | 'reset'>;
		/** What **Run** does now, which gives its icon. */
		action: RunAction;
		/** Whether the learner is typing in the code. */
		pale: boolean;
	}

	let { commands, action, pale }: Props = $props();

	/** The icon of the first control, by what it does now: ▶ to run or resume, ⏸ to pause. */
	const RUN_ICONS = {
		run: 'play',
		pause: 'pause',
		resume: 'play'
	} as const satisfies Record<RunAction, IconName>;

	/** A press of the pointer on a control leaves the focus where it was. */
	function keepFocus(event: MouseEvent) {
		event.preventDefault();
	}
</script>

<div class="controls" class:pale>
	<IconButton
		zone="code"
		main
		icon={RUN_ICONS[action]}
		label={commands.run.label}
		shortcut={commands.run.shortcut}
		greyed={!commands.run.enabled}
		onmousedown={keepFocus}
		onclick={() => {
			commands.run.run();
		}}
	/>
	<IconButton
		zone="code"
		icon="step"
		label={commands.step.label}
		shortcut={commands.step.shortcut}
		greyed={!commands.step.enabled}
		onmousedown={keepFocus}
		onclick={() => {
			commands.step.run();
		}}
	/>
	<IconButton
		zone="code"
		icon="reset"
		label={commands.reset.label}
		shortcut={commands.reset.shortcut}
		help={t('control-reset-help')}
		greyed={!commands.reset.enabled}
		onmousedown={keepFocus}
		onclick={() => {
			commands.reset.run();
		}}
	/>
</div>

<style>
	.controls {
		display: flex;
		gap: var(--space-8);
	}

	/* At 30 % while the learner types, a value of the mock-up tuned by eye: the code behind is
	   read, and the controls are still found. */
	.pale {
		opacity: 0.3;
	}
</style>
