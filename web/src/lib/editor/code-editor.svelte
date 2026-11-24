<!-- The code editor (see Code editor in specs.md): CodeMirror, made of the parts listed in
     setup.ts, with our look. It opens on a text and keeps its own document from then on, until
     the screen opens it again on another (`reopen` of `Editing`): the screen shows one editor
     per level, made again when the level changes. Made once the core has loaded, which gives the
     code its colors. It shows the lines of a run that the screen gives it (run-lines.ts), and the
     breakpoints, in the margin before the numbers (breakpoints.ts, margin.ts).

     `--below`, the room under the last line of the code, so that what floats in the corner of
     the editor hides no line once the code has scrolled to its end: the padding of the code by
     default. -->
<script lang="ts">
	import { EditorState } from '@codemirror/state';
	import { EditorView } from '@codemirror/view';
	import { untrack } from 'svelte';
	import { t } from '#lib/i18n.ts';
	import { breakpoints as breakpointsOn, breakpointsOf } from './breakpoints.ts';
	import type { Explain } from './checks.ts';
	import { followEditing } from './editing.svelte.ts';
	import { type CodeChange, codeChange, type Editing } from './edits.ts';
	import { lockOf, setLock } from './lock.ts';
	import { type RunLine, showLine } from './run-lines.ts';
	import { editorSetup } from './setup.ts';
	import { isTyped } from './typing.ts';

	interface Props {
		/** The code that the editor opens on; a change of it later is not followed. */
		text: string;
		/**
		 * The lines of the breakpoints that the editor opens with, saved with the code; a change of
		 * them later is not followed. None by default.
		 */
		breakpoints?: readonly number[];
		/**
		 * Writes the sentences of an error of the checks, which the editor underlines; read once,
		 * as the editor is made.
		 */
		explain: Explain;
		/**
		 * Whether the code can't be changed: while its program runs or is paused. The cursor
		 * still moves in it.
		 */
		locked?: boolean;
		/**
		 * The line of the next step of the program, lit; nothing while no program waits on a
		 * step. The code scrolls just enough for it to be seen as it changes.
		 */
		next?: number | undefined;
		/**
		 * The line where an error stopped the program, marked; nothing once the screen takes it
		 * away. It stays on its line while the code changes around it, and goes with its line.
		 */
		failed?: number | undefined;
		/** The editor shown, for the commands of the screen; nothing once it has gone. */
		editing?: Editing;
		/**
		 * Says that the code has changed in the editor, typed or by a command of the screen, once
		 * `editing` holds the code changed, with what changed. Never when the editor opens, nor
		 * when the screen opens it again.
		 */
		onchange?: (change: CodeChange) => void;
		/**
		 * Says that the breakpoints have changed, set or removed, once `editing` holds them; not
		 * when they follow a change of the code, which `onchange` says.
		 */
		onbreakpoints?: () => void;
		/**
		 * Says that the learner typed in the code: a character written or erased, a line
		 * broken, an indentation (`isTyped`). Not a line moved nor a change undone.
		 */
		ontype?: () => void;
		/**
		 * Says that the learner tried to change the code while it is locked: a key of typing,
		 * Tab and Shift+Tab included, a text pasted, cut or dropped (lock.ts). The code doesn't
		 * change.
		 */
		onrefuse?: () => void;
	}

	let {
		text,
		breakpoints = [],
		explain,
		locked = false,
		next,
		failed,
		editing = $bindable(),
		onchange,
		onbreakpoints,
		ontype,
		onrefuse
	}: Props = $props();

	/** Makes the editor in its block, and takes it away with it. */
	function mount(block: HTMLElement): () => void {
		const extensions = [
			editorSetup(
				t('editor-name'),
				untrack(() => explain)
			),
			// What the screen reads of the editor follows each of its changes. `follow` is made
			// just under, with the editor: CodeMirror calls a listener at the end of an update or
			// of a measure, never while it makes the editor (read in `@codemirror/view` 6.43), nor
			// when it is given a new state (`setState`).
			EditorView.updateListener.of((update) => {
				follow(update.state);
				if (update.docChanged) {
					const { changes, startState, state } = update;
					onchange?.(codeChange({ changes, before: startState.doc, after: state.doc }));
				} else if (breakpointsOf(update.startState) !== breakpointsOf(update.state)) {
					onbreakpoints?.();
				}
				if (update.transactions.some(isTyped)) ontype?.();
			})
		];
		/**
		 * A state of the editor on a text and its breakpoints, its code locked or not as the screen
		 * says now.
		 */
		const stateOn = (doc: string, saved: readonly number[]) =>
			EditorState.create({
				doc,
				extensions: [
					extensions,
					breakpointsOn(saved),
					lockOf(
						untrack(() => locked),
						() => onrefuse?.()
					)
				]
			});
		const view = new EditorView({
			parent: block,
			state: stateOn(
				untrack(() => text),
				untrack(() => breakpoints)
			)
		});
		/** Shows a line of the run as the screen gives it now, unless it stands there already. */
		const showNow = (line: RunLine, at: number | undefined) => {
			const shown = showLine(view.state, line, at);
			if (shown) view.dispatch(shown);
		};
		// A new state, rather than a change of the text: the history starts again with it, and no
		// breakpoint. The editor keeps its page, so the keyboard stays in the code if it was there.
		// A new state has no line of a run: they come back as the screen gives them, whatever it
		// did before.
		const { editing: own, follow } = followEditing(
			view,
			(reopened) => {
				view.setState(stateOn(reopened, []));
				untrack(() => {
					showNow('next', next);
					showNow('failed', failed);
				});
			},
			() => {
				view.focus();
			}
		);
		editing = own;
		// The lock follows the screen, in an effect of its own: read here, it would make the
		// editor again at each change.
		$effect(() => {
			if (view.state.readOnly !== locked) view.dispatch(setLock(locked));
		});
		// The lines of the run too, each as the screen changes it. A line that the code carried
		// elsewhere, or took away, stays so until the screen gives another one: the next **Run**
		// or **Reset**, which always takes the line away before an error gives it again.
		$effect(() => {
			showNow('next', next);
		});
		$effect(() => {
			showNow('failed', failed);
		});
		return () => {
			// The editor of the next level may have taken its place already. Read in a cleanup,
			// `editing` is as it was before the changes of the batch (see `kept` in
			// core/core-ready.svelte.ts): this sees an editor that took the place in an earlier
			// batch, never one of this batch. It holds as the screen makes its editors: Svelte
			// takes away the editor of a level before it makes the one of the next, which writes
			// `editing` after this.
			if (editing === own) editing = undefined;
			view.destroy();
		};
	}
</script>

<div class="editor" {@attach mount}></div>

<style>
	/* CodeMirror writes its own markup and brings a look of its own, which every rule here
	   replaces with the design tokens: its classes are named as they are (`:global`), under the
	   block of the editor and under `.cm-editor`, so that each rule wins over the one it
	   replaces, wherever CodeMirror puts its style sheet. */
	.editor {
		/* The margin of the numbers of the lines, as wide as in the mock-up, of which the marks
		   of a run take the first 21 pixels: room for the arrow of the next step, 6 pixels from
		   the edge as in the mock-up, left of a number of three figures. */
		--margin: 52px;
		--marks: 21px;
		height: 100%;
		/* CodeMirror stacks what it draws with figures of its own (200 for its margin): an order
		   inside the block, which is never compared with the layers of the page. */
		isolation: isolate;
	}

	.editor :global {
		.cm-editor {
			height: 100%;
			background: var(--surface);
			color: var(--text);
		}

		/* The editor shows its cursor instead of the ring of the keyboard focus. */
		.cm-editor.cm-focused {
			outline: none;
		}

		.cm-editor .cm-scroller {
			overflow: auto;
			font: var(--weight-code) var(--size-code) / var(--line-code) var(--font-code);
			font-variant-ligatures: none;
		}

		/* The thin line at the 80th column, drawn behind the code: it scrolls with it, and
		   stands past the width of the editor on a small window. */
		.cm-editor .cm-content {
			padding: var(--space-12) 0 var(--below, var(--space-12));
			background-image: linear-gradient(var(--hover), var(--hover));
			background-repeat: no-repeat;
			background-position: calc(var(--space-12) + 80ch) 0;
			background-size: 1px 100%;
		}

		.cm-editor .cm-line {
			padding: 0 var(--space-12);
		}

		.cm-editor .cm-gutters {
			border: 0;
			background: var(--surface);
			color: var(--gutter-text);
		}

		/* A number sits 9 pixels from the code side of the margin and is a little smaller than
		   the code, both tuned by eye on the mock-up. */
		.cm-editor .cm-lineNumbers .cm-gutterElement {
			min-width: calc(var(--margin) - var(--marks));
			padding: 0 9px 0 0;
			font-size: 0.88em;
		}

		/* The marks of the margin, before the numbers: a breakpoint, an icon of a run of 13
		   pixels, or both, in the middle of their line. A click there sets or removes a
		   breakpoint. */
		.cm-editor .margin-marks {
			width: var(--marks);
			/* CodeMirror hides what passes its gutters: the arrow beside a breakpoint passes. */
			overflow: visible;
			cursor: pointer;
		}

		.cm-editor .margin-marks .cm-gutterElement {
			display: flex;
			align-items: center;
			padding-left: var(--space-6);
		}

		/* Over the place of the numbers, whose line may be lit, where the arrow beside a
		   breakpoint stands. */
		.cm-editor .margin-mark {
			position: relative;
			z-index: 1;
			display: flex;
			align-items: center;
		}

		/* A breakpoint: a dot of 11 pixels, as in the mock-up. */
		.cm-editor .breakpoint-dot {
			width: 11px;
			height: 11px;
			border-radius: 50%;
			background: var(--breakpoint);
		}

		.cm-editor .margin-icon {
			display: flex;
		}

		/* A breakpoint on the line of the next step or of an error: the dot and the arrow, or the
		   cross, side by side, 3 pixels from the edge, before the numbers of two figures, as in
		   the mock-up. */
		.cm-editor .margin-mark.with-breakpoint {
			margin-left: -3px;
		}

		/* The line of the next step, and the one where an error stopped the program: lit on the
		   whole width of the code and of its margin, its number in the strong weight. The arrow
		   of the next step in amber, the cross of an error in red, as its number. */
		.cm-editor .cm-line.run-next,
		.cm-editor .cm-gutterElement.run-next {
			background: var(--current);
		}

		.cm-editor .cm-line.run-failed,
		.cm-editor .cm-gutterElement.run-failed {
			background: var(--error-soft);
		}

		.cm-editor .cm-lineNumbers .cm-gutterElement.run-next {
			color: var(--text);
			font-weight: var(--weight-code-strong);
		}

		.cm-editor .cm-lineNumbers .cm-gutterElement.run-failed {
			color: var(--error);
			font-weight: var(--weight-code-strong);
		}

		.cm-editor .margin-mark.run-next {
			color: var(--accent-text);
		}

		.cm-editor .margin-mark.run-failed {
			color: var(--error);
		}

		/* The cursor: 2 pixels wide, on the place between two characters. */
		.cm-editor .cm-cursor,
		.cm-editor .cm-dropCursor {
			margin-left: -1px;
			border-left: 2px solid var(--text);
		}

		/* The pair of parentheses that the cursor touches, while the keyboard is in the code:
		   a quiet fill in a thin frame, drawn inside the place of the character. */
		.cm-editor.cm-focused .matching-parenthesis {
			background: var(--hover);
			outline: 1px solid var(--gutter-text);
			outline-offset: -1px;
		}

		/* The underlines of the checks (checks.ts), drawn as in the mock-up, under the letters of
		   their stretch, 4 pixels high at the bottom of the line: a layer of their own, since a
		   mask on the stretch would cut its letters too. Its bottom stands 2 pixels under the
		   letters of the stretch, which leave the rest of the line to its height: tuned by eye on
		   the mock-up, as the code is in one font and one size. */
		.cm-editor .underline-error,
		.cm-editor .underline-missing,
		.cm-editor .underline-long {
			position: relative;
		}

		.cm-editor .underline-error::after,
		.cm-editor .underline-missing::after,
		.cm-editor .underline-long::after {
			content: '';
			position: absolute;
			bottom: -2px;
			left: 0;
			height: 4px;
			pointer-events: none;
		}

		/* An error: a red wave, its path the one of the mock-up. */
		.cm-editor .underline-error::after,
		.cm-editor .underline-missing::after {
			background: var(--error);
			mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4'%3E%3Cpath d='M0 3 Q1.5 0 3 2 T6 3' fill='none' stroke='black' stroke-width='1.3'/%3E%3C/svg%3E")
				repeat-x;
		}

		.cm-editor .underline-error::after,
		.cm-editor .underline-long::after {
			right: 0;
		}

		/* Where something is missing, between two characters: the wave of one character, after
		   the place, where the missing piece would go. */
		.cm-editor .underline-missing::after {
			width: 1ch;
		}

		/* A line too long, from its 81st character: grey dots, an advice and not an error. */
		.cm-editor .underline-long::after {
			background: radial-gradient(circle at 1.5px 2px, var(--weak) 1.1px, transparent 1.4px) 0 0 /
				4px 4px repeat-x;
		}

		/* What the underlines say under the pointer, under the line: on one line, and on several
		   once it is longer than 60 characters. */
		.cm-editor .cm-tooltip {
			border: var(--pop-border);
			background: var(--pop);
			color: var(--text);
			box-shadow: var(--pop-shadow);
		}

		.cm-editor .underline-tip {
			max-width: 60ch;
			padding: var(--space-6) var(--space-12);
			font: var(--weight-code) var(--size-code-small) / var(--line-code-small) var(--font-code);
		}

		.cm-editor .underline-tip p {
			margin: 0;
		}

		.cm-editor .underline-tip p + p {
			margin-top: var(--space-8);
		}

		.cm-editor .underline-tip strong {
			display: block;
			font-weight: var(--weight-code-strong);
		}

		/* The selection keeps its color while the keyboard is elsewhere. */
		.cm-editor .cm-selectionBackground,
		.cm-editor.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground {
			background: var(--select);
		}
	}
</style>
