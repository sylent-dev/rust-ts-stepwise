<!-- The menu bar of a header, as the one of a code editor (see Level screen in specs.md). It
     draws the state of menus.ts, and wires the mouse and the keys to it. One rule keeps the two
     together: the bar moves the focus of the keyboard itself, onto the lit row or else onto the
     name of its menu, and a menu is open only while the bar holds that focus. So Tab, or
     another window, closes the menu; a press of the pointer elsewhere closes it too, since some
     move no focus (a scroll bar). The rows of every menu stay in the page,
     hidden until their menu opens: a menu grows as it opens and goes back as it closes, by its
     styles alone. A row leads to a page, or runs a command of the screen (commands.ts), which
     gives it its text, its shortcut and its state. -->
<script lang="ts">
	import { flushSync } from 'svelte';
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n.ts';
	import { currentPlatform } from '#lib/platform.ts';
	import { spokenShortcut, type ScreenCommand } from './commands.ts';
	import { canChoose, closedOn, openOn, pressKey, type BarState, type Menu } from './menus.ts';
	import ShortcutKeys from './shortcut-keys.svelte';

	let { menus }: { menus: readonly Menu[] } = $props();

	const id = $props.id();
	const nameId = (menu: number) => `${id}-name-${menu}`;
	const rowsId = (menu: number) => `${id}-rows-${menu}`;
	const rowId = (menu: number, row: number) => `${id}-row-${menu}-${row}`;

	const platform = currentPlatform();

	let bar: BarState = $state(closedOn(0));

	/** The bar in the page, to tell a press of the pointer in it from one elsewhere. */
	let root = $state<HTMLElement>();

	/**
	 * Whether the learner used the keyboard last, rather than the pointer: only then does the ring
	 * of the focus show. The bar moves the focus for the mouse too, so a browser can't tell.
	 */
	let keys = $state(false);

	/** Whether the menu shown took the place of its neighbor: it is then there at once. */
	let swap = $state(false);

	/**
	 * What held the focus of the keyboard when the pointer opened a menu: the code, most often.
	 * A command run from that menu gives the focus back to it, as the menu of a code editor does,
	 * so that the learner goes on typing. Nothing once the menu has closed, nor when the keyboard
	 * came to the bar by itself (Tab): the focus then stays on the name of the menu, as after
	 * Escape.
	 */
	let cameFrom: HTMLElement | undefined;

	/** Puts the bar in a state. */
	function set(next: BarState) {
		swap = bar.open && next.open && bar.menu !== next.menu;
		if (!next.open) cameFrom = undefined;
		bar = next;
	}

	/** Whether the bar is moving the focus itself, rather than the browser or a screen reader. */
	let moving = false;

	/** Moves the bar, then the focus of the keyboard after it. */
	function go(next: BarState) {
		set(next);
		// The rows of a menu that opens must show before one of them can take the focus.
		flushSync();
		const holder = bar.open && bar.row !== null ? rowId(bar.menu, bar.row) : nameId(bar.menu);
		moving = true;
		try {
			document.getElementById(holder)?.focus();
		} finally {
			moving = false;
		}
	}

	/**
	 * The focus arrives on the name of a menu (`row` is null) or on one of its rows without the
	 * bar moving it: under a screen reader, which moves it with a cursor of its own, or when the
	 * window comes back and the browser gives the focus again to what held it. The bar follows
	 * it. The ring stays as it was: a browser can't say here whether the focus must show
	 * (`:focus-visible`), since the bar moves it for the mouse too.
	 */
	function arrive(menu: number, row: number | null) {
		if (moving) return;
		if (row === null) {
			if (bar.menu !== menu || bar.row !== null) {
				set(bar.open && bar.menu === menu ? openOn(menu) : closedOn(menu));
			}
		} else if (bar.open && bar.menu === menu) set({ menu, open: true, row });
		// A row of a menu that the bar has closed, as when the window comes back: its name takes
		// the focus, and the menu stays closed.
		else go(closedOn(menu));
	}

	/** Moves the bar after the pointer, which a move alone doesn't tell from the keyboard. */
	function point(next: BarState) {
		keys = false;
		go(next);
	}

	/**
	 * The pointer moves over a row of the open menu: the row is lit when it can be chosen (`row`),
	 * and no row is otherwise (null).
	 */
	function hover(menu: number, row: number | null) {
		// The row that the keys lit loses its ring under the pointer.
		if (keys || bar.row !== row) point({ menu, open: true, row });
	}

	/** A click on the name of a menu opens it, or closes it when it is open. */
	function toggle(menu: number, open: boolean) {
		if (open) {
			go(closedOn(menu));
			return;
		}
		// The press of the mouse moved no focus (see the bar below): what holds it still does.
		const holder = document.activeElement;
		const outside = holder instanceof HTMLElement && !root?.contains(holder);
		go(openOn(menu));
		if (outside) cameFrom = holder === document.body ? undefined : holder;
	}

	/**
	 * Runs the command of a row: its menu closes, and the focus goes back to what the pointer
	 * took it from, or else to the name of the menu.
	 */
	function run(menu: number, command: ScreenCommand) {
		// A greyed row runs nothing, and its menu stays open.
		if (!command.enabled) return;
		const back = cameFrom;
		if (back?.isConnected) {
			set(closedOn(menu));
			// Without a scroll: the code would jump to its first line, and the command shows its
			// own place.
			back.focus({ preventScroll: true });
		} else go(closedOn(menu));
		command.run();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.altKey || event.metaKey) return;
		const outcome = pressKey(bar, event.key, menus, event.repeat);
		if (!outcome) return;
		if ('runs' in outcome) {
			event.preventDefault();
			// A row runs by its own click, which also closes its menu, as under the mouse.
			document.getElementById(rowId(bar.menu, outcome.runs))?.click();
		} else {
			if (!outcome.passes) event.preventDefault();
			go(outcome.state);
		}
	}

	/** The focus has left the bar: its menu closes, and the focus stays where it went. */
	function onfocusout(event: FocusEvent & { currentTarget: HTMLElement }) {
		const next = event.relatedTarget;
		if (next instanceof Node && event.currentTarget.contains(next)) return;
		set(closedOn(bar.menu));
	}

	/**
	 * A key of the window: the learner is on the keyboard. A modifier alone, or a shortcut, doesn't
	 * say so.
	 */
	function onwindowkey(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.altKey || event.metaKey) && event.key !== 'Shift') keys = true;
	}

	/**
	 * The pointer went down: the ring goes, and so does a menu when the press was elsewhere. The
	 * name of the menu takes the focus first, or a press that moves none would leave it on a row
	 * that disappears; the browser then moves it where the press goes.
	 */
	function onwindowpress(event: PointerEvent) {
		keys = false;
		if (bar.open && event.target instanceof Node && !root?.contains(event.target)) {
			go(closedOn(bar.menu));
		}
	}
</script>

<svelte:window onkeydowncapture={onwindowkey} onpointerdowncapture={onwindowpress} />

<!-- The mouse never moves the focus in the bar by itself: a browser gives it to a row but not
     always to a button (Safari), and takes it from the bar on a click between two rows. -->
<!-- svelte-ignore a11y_interactive_supports_focus (the focus is on a name or on a row, never on the bar) -->
<div
	bind:this={root}
	class="menus"
	class:keys
	class:swap
	role="menubar"
	aria-label={t('menus-name')}
	{onfocusout}
	onmousedown={(event) => event.preventDefault()}
>
	{#each menus as menu, m (menu.id)}
		{@const open = bar.open && bar.menu === m}
		<div class="menu" role="none">
			<button
				type="button"
				class="band-item"
				role="menuitem"
				id={nameId(m)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={rowsId(m)}
				tabindex={bar.menu === m ? 0 : -1}
				onclick={() => toggle(m, open)}
				onpointerenter={(event) => {
					// Once a menu is open, pointing at another name opens that one. A finger only taps.
					if (event.pointerType === 'mouse' && bar.open && !open) point(openOn(m));
				}}
				onfocus={() => arrive(m, null)}
				{onkeydown}
			>
				{menu.name}
			</button>
			<!-- svelte-ignore a11y_interactive_supports_focus (the focus is on a row, never on the menu) -->
			<div
				class="rows"
				role="menu"
				id={rowsId(m)}
				aria-labelledby={nameId(m)}
				hidden={!open}
				onpointerleave={() => {
					if (open && bar.row !== null) point(openOn(m));
				}}
			>
				{#each menu.rows as row, r (r)}
					{#if row.kind === 'link'}
						<a
							class="row"
							role="menuitem"
							id={rowId(m, r)}
							tabindex="-1"
							href={resolve(row.to)}
							target={row.tab}
							onclick={() => go(closedOn(m))}
							onpointermove={() => hover(m, r)}
							onfocus={() => arrive(m, r)}
							{onkeydown}
						>
							{row.label}
						</a>
					{:else if row.kind === 'command'}
						{@const command = row.command}
						<!-- Greyed, it stays in its place and keeps the focus if it holds it. -->
						<button
							type="button"
							class="row"
							class:off={!command.enabled}
							role="menuitem"
							id={rowId(m, r)}
							tabindex="-1"
							aria-disabled={!command.enabled}
							aria-keyshortcuts={command.shortcut && spokenShortcut(command.shortcut, platform)}
							onclick={() => run(m, command)}
							onpointermove={() => hover(m, canChoose(row) ? r : null)}
							onfocus={() => arrive(m, r)}
							{onkeydown}
						>
							{command.label}
							{#if command.shortcut}
								<ShortcutKeys shortcut={command.shortcut} />
							{/if}
						</button>
					{:else if row.kind === 'here'}
						<span
							class="row here"
							role="menuitem"
							aria-current="page"
							aria-disabled="true"
							onpointermove={() => hover(m, null)}
						>
							{row.label}
						</span>
					{:else}
						<div class="line" role="separator"></div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.menus {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-left: var(--space-24);
	}

	/* The ring of the focus (base.css) shows after a key and never after the pointer: the bar
	   says which, since it moves the focus for both. */
	.menus :focus-visible {
		outline: none;
	}

	.menus.keys :focus {
		outline: var(--focus-ring);
		outline-offset: var(--focus-offset);
	}

	/* A menu opens against the bottom of the header, the box it is placed in. With no `left` of
	   its own, it starts where it stands in the page: under the left end of its name. Its width
	   is the one of the mock-up, for the longest row with its shortcut. */
	.rows {
		position: absolute;
		top: 100%;
		z-index: var(--layer-pop);
		box-sizing: border-box;
		width: 272px;
		padding: var(--space-4) 0;
		background: var(--pop);
		box-shadow: var(--pop-shadow);
	}

	/* A menu grows from the corner under its name, from 85% of its size, and goes back the same
	   way when it closes, a little faster: the one thing the learner opens that isn't there at
	   once (see Motion in docs/design-system.md). Its rows answer while it grows, not while it
	   goes. A browser that doesn't know these rules shows and hides it at once. */
	.rows {
		transform-origin: top left;
		transition:
			opacity var(--duration-fade) var(--ease-appear),
			transform var(--duration-fade) var(--ease-appear),
			display var(--duration-fade) allow-discrete;
	}

	.rows[hidden] {
		/* Written here too: the rule of the browser gives way to any `display` of ours. */
		display: none;
		opacity: 0;
		transform: scale(0.85);
		pointer-events: none;
		transition-duration: calc(var(--duration-fade) * 0.6);
	}

	@starting-style {
		.rows:not([hidden]) {
			opacity: 0;
			transform: scale(0.85);
		}
	}

	/* A menu that takes the place of its neighbor is there at once, and nothing moves for a
	   learner who asked for less motion. */
	.menus.swap .rows {
		transition: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.rows {
			transition: none;
		}
	}

	/* A row is a band across the whole width of its menu, under the arrow of the pointer, as in
	   the menu of a code editor: neither the hand of a link nor the cursor of a text. Its text
	   against its left end, and the shortcut of its command against its right end. A link, a
	   button and a text share this look: what a button draws by itself is taken away. */
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-24);
		box-sizing: border-box;
		width: 100%;
		padding: var(--space-6) var(--space-12);
		border: 0;
		background: none;
		color: inherit;
		text-align: start;
		text-decoration: none;
		cursor: default;
	}

	/* A row whose command can't run now is greyed, its shortcut with it: the color of what comes
	   second, paler still. The 55% is the one of the mock-up, tuned by eye. */
	.off {
		color: var(--weak);
		opacity: 0.55;
	}

	/* A thin line between two groups of rows. */
	.line {
		margin: var(--space-4) 0;
		border-top: 1px solid var(--hover);
	}

	/* One row is lit at a time, the one that holds the focus: under the pointer, or chosen with
	   the keys. The row of the screen already shown is lit as well, as if already chosen. */
	.row:focus,
	.here {
		background: var(--hover);
	}
</style>
