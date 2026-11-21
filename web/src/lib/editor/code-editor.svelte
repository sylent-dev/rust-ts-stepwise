<!-- The code editor (see Code editor in specs.md): CodeMirror, made of the parts listed in
     setup.ts, with our look. It opens on a text and keeps its own document from then on: the
     screen shows one editor per level, made again when the level changes. Made once the core
     has loaded, which gives the code its colors. -->
<script lang="ts">
	import { EditorState } from '@codemirror/state';
	import { EditorView } from '@codemirror/view';
	import { untrack } from 'svelte';
	import { t } from '#lib/i18n.ts';
	import { editorSetup } from './setup.ts';

	interface Props {
		/** The code that the editor opens on; a change of it later is not followed. */
		text: string;
	}

	let { text }: Props = $props();

	/** Makes the editor in its block, and takes it away with it. */
	function mount(block: HTMLElement): () => void {
		const view = new EditorView({
			parent: block,
			state: EditorState.create({
				doc: untrack(() => text),
				extensions: editorSetup(t('editor-name'))
			})
		});
		return () => {
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
		/* The margin of the numbers of the lines, as wide as in the mock-up: room for a
		   breakpoint and the arrow of the next step (steps 17 and 19) left of a number of three
		   figures. */
		--margin: 52px;
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
			padding: var(--space-12) 0;
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
			min-width: var(--margin);
			padding: 0 9px 0 0;
			font-size: 0.88em;
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

		/* The selection keeps its color while the keyboard is elsewhere. */
		.cm-editor .cm-selectionBackground,
		.cm-editor.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground {
			background: var(--select);
		}
	}
</style>
