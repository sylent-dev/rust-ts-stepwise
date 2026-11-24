// The marks of the margin, before the numbers of the lines (see Code editor and Running a program
// in specs.md): the breakpoints (breakpoints.ts), and the lines of a run (run-lines.ts), the arrow
// of the next step and the cross of an error. A click in the margin sets or removes a breakpoint.

import { type EditorState, type Extension, RangeSet } from '@codemirror/state';
import { type BlockInfo, type EditorView, GutterMarker, gutter } from '@codemirror/view';
import { mount, unmount } from 'svelte';
import type { IconName } from '#lib/icon-name.ts';
import Icon from '#lib/icon.svelte';
import { breakpointsOf, toggleBreakpointAt } from './breakpoints.ts';
import { RUN_LINE_CLASSES, type RunLine, runLinesOf } from './run-lines.ts';

/**
 * What the margin shows on a line: a breakpoint, the arrow of the next step or the cross of an
 * error, or a breakpoint beside one of them, as in the mock-up.
 */
export type MarginMark = 'breakpoint' | 'next' | 'breakpoint-next' | 'failed' | 'breakpoint-failed';

/** The marks of the margin of each line that has one, by the number of the line, in order. */
export function marginMarks(state: EditorState): { line: number; mark: MarginMark }[] {
	const { next, failed } = runLinesOf(state);
	const held = breakpointsOf(state);
	const lines = new Set(held);
	if (next !== undefined) lines.add(next);
	if (failed !== undefined) lines.add(failed);
	const markOf = (line: number): MarginMark => {
		const breakpoint = held.includes(line);
		if (line === next) return breakpoint ? 'breakpoint-next' : 'next';
		if (line === failed) return breakpoint ? 'breakpoint-failed' : 'failed';
		return 'breakpoint';
	};
	return [...lines]
		.filter((line) => line >= 1 && line <= state.doc.lines)
		.sort((first, second) => first - second)
		.map((line) => ({ line, mark: markOf(line) }));
}

/** The line of a run whose icon a mark draws, and its color. */
const RUN_LINES = {
	breakpoint: undefined,
	next: 'next',
	'breakpoint-next': 'next',
	failed: 'failed',
	'breakpoint-failed': 'failed'
} as const satisfies Record<MarginMark, RunLine | undefined>;

/** Whether a mark draws a breakpoint. */
const WITH_BREAKPOINT = {
	breakpoint: true,
	next: false,
	'breakpoint-next': true,
	failed: false,
	'breakpoint-failed': true
} as const satisfies Record<MarginMark, boolean>;

/** The icon of a line of a run in the margin: the arrow of the next step, the cross of an error. */
const ICONS = {
	next: 'next',
	failed: 'close'
} as const satisfies Record<RunLine, IconName>;

/** The icons drawn in the margin, each by the box it was drawn in, to take it away with it. */
const drawn = new WeakMap<Node, ReturnType<typeof mount>>();

/**
 * The mark of a line in the margin: the dot of a breakpoint, then the icon of a line of a run,
 * in the color of that line (`run-next`, `run-failed`, which its number takes too).
 */
class Mark extends GutterMarker {
	readonly #mark: MarginMark;

	constructor(mark: MarginMark) {
		super();
		this.#mark = mark;
	}

	override eq(other: GutterMarker): boolean {
		return other instanceof Mark && other.#mark === this.#mark;
	}

	override toDOM(): Node {
		const box = document.createElement('span');
		const run = RUN_LINES[this.#mark];
		const both = WITH_BREAKPOINT[this.#mark] && run !== undefined;
		box.className = ['margin-mark', both && 'with-breakpoint', run && RUN_LINE_CLASSES[run]]
			.filter(Boolean)
			.join(' ');
		if (WITH_BREAKPOINT[this.#mark]) {
			const dot = document.createElement('span');
			dot.className = 'breakpoint-dot';
			box.append(dot);
		}
		if (run) {
			const icon = document.createElement('span');
			icon.className = 'margin-icon';
			box.append(icon);
			drawn.set(box, mount(Icon, { target: icon, props: { name: ICONS[run], size: 13 } }));
		}
		return box;
	}

	override destroy(dom: Node): void {
		const icon = drawn.get(dom);
		drawn.delete(dom);
		if (icon) void unmount(icon);
	}
}

const MARKS = {
	breakpoint: new Mark('breakpoint'),
	next: new Mark('next'),
	'breakpoint-next': new Mark('breakpoint-next'),
	failed: new Mark('failed'),
	'breakpoint-failed': new Mark('breakpoint-failed')
} as const satisfies Record<MarginMark, Mark>;

/**
 * Sets or removes a breakpoint on the line clicked in the margin. The press of the mouse is
 * taken, so that the keyboard stays where it was, and the cursor too: a click of the main button
 * alone. CodeMirror gives the line nearest to a press past the code, in the room under its last
 * line or above its first one, where the press sets nothing.
 */
function pressed(view: EditorView, block: BlockInfo, event: Event): boolean {
	if (!(event instanceof MouseEvent) || event.button !== 0) return false;
	const y = event.clientY - view.documentTop;
	if (y < block.top || y > block.bottom) return true;
	const toggled = toggleBreakpointAt(view.state, view.state.doc.lineAt(block.from).number);
	if (toggled) view.dispatch(toggled);
	return true;
}

/**
 * The margin of the marks, in a gutter of its own before the numbers: the editor puts it first.
 * The look is with the editor's.
 */
export const margin: Extension = gutter({
	class: 'margin-marks',
	markers: (view) =>
		RangeSet.of(
			marginMarks(view.state).map(({ line, mark }) =>
				MARKS[mark].range(view.state.doc.line(line).from)
			)
		),
	domEventHandlers: {
		mousedown: (view, block, event) => pressed(view, block, event)
	}
});
