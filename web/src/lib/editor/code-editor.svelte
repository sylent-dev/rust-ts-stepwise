<!-- The code editor (see Code editor in specs.md): CodeMirror, made of the parts listed in
     setup.ts, with our look. It opens on a text and keeps its own document from then on, until
     the screen opens it again on another (`reopen` of `Editing`): the screen shows one editor
     per level, made again when the level changes. Made once the core has loaded, which gives the
     code its colors. It shows the lines of a run that the screen gives it (run-lines.ts).

     `--below`, the room under the last line of the code, so that what floats in the corner of
     the editor hides no line once the code has scrolled to its end: the padding of the code by
     default. -->
<script lang="ts">
	import { EditorState } from '@codemirror/state';
	import { EditorView } from '@codemirror/view';
	import { untrack } from 'svelte';
	import { t } from '#lib/i18n.ts';
	import type { Explain } from './checks.ts';
	import { followEditing } from './editing.svelte.ts';
	import type { Editing } from './edits.ts';
	import { lockOf, setLock } from './lock.ts';
	import { showLine } from './run-lines.ts';
	import { editorSetup } from './setup.ts';
	import { isTyped } from './typing.ts';

	interface Props {
		/** The code that the editor opens on; a change of it later is not followed. */
		text: string;
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
		 * `editing` holds the code changed. Never when the editor opens, nor when the screen opens
		 * it again.
		 */
		onchange?: () => void;
		/**
		 * Says that the learner typed in the code: a character written or erased, a line
		 * broken, an indentation (`isTyped`). Not a line moved nor a change undone.
		 */
		ontype?: () => void;
	}

	let {
		text,
		explain,
		locked = false,
		next,
		failed,
		editing = $bindable(),
		onchange,
		ontype
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
				if (update.docChanged) onchange?.();
				if (update.transactions.some(isTyped)) ontype?.();
			})
		];
		/** A state of the editor on a text, its code locked or not as the screen says now. */
		const stateOn = (doc: string) =>
			EditorState.create({ doc, extensions: [extensions, lockOf(untrack(() => locked))] });
		const view = new EditorView({ parent: block, state: stateOn(untrack(() => text)) });
		// A new state, rather than a change of the text: the history starts again with it. The
		// editor keeps its page, so the keyboard stays in the code if it was there.
		const { editing: own, follow } = followEditing(view, (reopened) => {
			view.setState(stateOn(reopened));
		});
		editing = own;
		// The lock follows the screen, in an effect of its own: read here, it would make the
		// editor again at each change.
		$effect(() => {
			if (view.state.readOnly !== locked) view.dispatch(setLock(locked));
		});
		// The lines of the run too, each as it changes. A line that the code carried elsewhere
		// stays there until the screen gives another one.
		$effect(() => {
			const shown = showLine(view.state, 'next', next);
			if (shown) view.dispatch(shown);
		});
		$effect(() => {
			const shown = showLine(view.state, 'failed', failed);
			if (shown) view.dispatch(shown);
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

		/* The marks of a run, before the numbers: an icon of 13 pixels in the middle of its
		   line. */
		.cm-editor .run-marks {
			width: var(--marks);
		}

		.cm-editor .run-marks .cm-gutterElement {
			display: flex;
			align-items: center;
			padding-left: var(--space-6);
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

		.cm-editor .run-mark.run-next {
			color: var(--accent-text);
		}

		.cm-editor .run-mark.run-failed {
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
