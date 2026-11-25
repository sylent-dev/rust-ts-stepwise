// The command menu of a screen (see Command menu in specs.md): the parts that the screen gives its
// editor, the panel that it mounts at the cursor, and what the command **Edit › Commands** asks of
// it. The editor doesn't know the menu: the screen gives it these parts (`parts` of
// editor/code-editor.svelte), as it gives the screen the editor shown.

import type { Extension } from '@codemirror/state';
import { type EditorView, type TooltipView, ViewPlugin } from '@codemirror/view';
import { mount, unmount } from 'svelte';
import { vocabulary } from '#lib/core/core.ts';
import CommandPanel from './command-panel.svelte';
import {
	chooseCategoryOf,
	chooseEntry,
	closeMenu,
	editorMenu,
	insertEntry,
	menuPanel,
	menuViewOf,
	openMenu,
	openMenuOf
} from './editor-menu.ts';
import { namesAtCursor } from './names.ts';
import { type Category, type MenuEntry, menuEntries, type WordEntry } from './words.ts';

/** The menus made so far, which give each list an id of its own in the page. */
let made = 0;

/**
 * The category that the menu opens on: Move the first time, then the one chosen last, by the keys,
 * the mouse or the letters typed, as long as the page stays open, from a screen to the next.
 */
let lastCategory: Category = 'move';

/** The command menu of a screen, in the editor that it shows. */
export class CommandMenu {
	/** The editor shown, while it is there. */
	#view: EditorView | undefined;
	readonly #listId = `command-menu-${String((made += 1))}`;
	/** The words of the language, once the editor is made. */
	#words: readonly WordEntry[] = [];

	/**
	 * The parts of the editor that make the menu, read as the editor is made, once the core has
	 * loaded: the menu lists the words that it gives.
	 */
	parts(): Extension {
		this.#words = menuEntries(vocabulary());
		return [
			editorMenu(this.#listId),
			menuPanel.of((view) => this.#panel(view)),
			ViewPlugin.define((view) => {
				this.#view = view;
				return {
					destroy: () => {
						if (this.#view === view) this.#view = undefined;
					}
				};
			})
		];
	}

	/**
	 * Opens the menu at the cursor of the code, or closes it when it is open; the code keeps the
	 * keyboard, or gets it. The menu lists the words of the language, then the names that a line
	 * written at the cursor may use, which the core reads in the code as it opens.
	 */
	toggle(): void {
		const view = this.#view;
		if (!view) return;
		const { state } = view;
		if (openMenuOf(state)) {
			view.dispatch({ effects: closeMenu });
		} else {
			const names = namesAtCursor(state);
			const entries = [...this.#words, ...names.entries];
			view.dispatch(openMenu(state, lastCategory, { entries, namesHiddenBy: names.hiddenBy }));
		}
		view.focus();
	}

	/** The panel of the menu, mounted in the block that the editor shows under the name. */
	#panel(view: EditorView): TooltipView {
		const dom = document.createElement('div');
		const shown = menuViewOf(view.state);
		if (!shown) return { dom };
		// The view is replaced whole at each change, never changed: kept raw, so that the panel
		// compares its words as they are, and read by a getter, so that the panel follows it.
		let current = $state.raw(shown);
		const props = {
			get view() {
				return current;
			},
			listId: this.#listId,
			onpoint: (entry: MenuEntry) => {
				chooseEntry(view, entry);
			},
			onpick: (entry: MenuEntry) => {
				insertEntry(view, entry);
			},
			oncategory: (category: Category) => {
				chooseCategoryOf(view, category);
			}
		};
		const panel = mount(CommandPanel, { target: dom, props });
		return {
			dom,
			update: ({ state }) => {
				const next = menuViewOf(state);
				if (!next) return;
				current = next;
				lastCategory = next.categories.find(({ chosen }) => chosen)?.category ?? lastCategory;
			},
			destroy: () => {
				void unmount(panel);
			}
		};
	}
}
