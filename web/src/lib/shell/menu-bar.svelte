<!-- The menu bar of a header, as the one of a code editor (see Level screen in specs.md). It
     draws the state of menus.ts, and wires the mouse and the keys to it. One rule keeps the two
     together: the bar moves the focus of the keyboard itself, onto the lit row or else onto the
     name of its menu, and a menu is open only while the bar holds that focus. So a click
     elsewhere, or another window, closes the menu. The rows of every menu stay in the page,
     hidden until their menu opens: a menu grows as it opens and goes back as it closes, by its
     styles alone. -->
<script lang="ts">
	import { flushSync } from 'svelte';
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n.ts';
	import { canChoose, closedOn, openOn, pressKey, type BarState, type Menu } from './menus.ts';

	let { menus }: { menus: readonly Menu[] } = $props();

	const id = $props.id();
	const nameId = (menu: number) => `${id}-name-${menu}`;
	const rowsId = (menu: number) => `${id}-rows-${menu}`;
	const rowId = (menu: number, row: number) => `${id}-row-${menu}-${row}`;

	let bar: BarState = $state(closedOn(0));

	/**
	 * Whether the learner used the keyboard last, rather than the pointer: only then does the ring
	 * of the focus show. The bar moves the focus for the mouse too, so a browser can't tell.
	 */
	let keys = $state(false);

	/** Whether the menu shown took the place of its neighbor: it is then there at once. */
	let swap = $state(false);

	/** Puts the bar in a state. */
	function set(next: BarState) {
		swap = bar.open && next.open && bar.menu !== next.menu;
		bar = next;
	}

	/** Moves the bar, then the focus of the keyboard after it. */
	function go(next: BarState) {
		set(next);
		// The rows of a menu that opens must show before one of them can take the focus.
		flushSync();
		const holder = bar.open && bar.row !== null ? rowId(bar.menu, bar.row) : nameId(bar.menu);
		document.getElementById(holder)?.focus();
	}

	/** Moves the bar after the pointer, which a move alone doesn't tell from the keyboard. */
	function point(next: BarState) {
		keys = false;
		go(next);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.altKey || event.metaKey) return;
		const outcome = pressKey(bar, event.key, menus);
		if (!outcome) return;
		if (!outcome.passes) event.preventDefault();
		// A row runs by its own click, which also closes its menu, as under the mouse.
		if (outcome.runs !== undefined) document.getElementById(rowId(bar.menu, outcome.runs))?.click();
		else go(outcome.state);
	}

	/** The focus has left the bar: its menu closes, and the focus stays where it went. */
	function onfocusout(event: FocusEvent & { currentTarget: HTMLElement }) {
		const next = event.relatedTarget;
		if (next instanceof Node && event.currentTarget.contains(next)) return;
		set(closedOn(bar.menu));
	}
</script>

<svelte:window onkeydowncapture={() => (keys = true)} onpointerdowncapture={() => (keys = false)} />

<!-- The mouse never moves the focus in the bar by itself: a browser gives it to a row but not
     always to a button (Safari), and takes it from the bar on a click between two rows. -->
<!-- svelte-ignore a11y_interactive_supports_focus (the focus is on a name or on a row, never on the bar) -->
<div
	class="menus"
	class:keys
	class:swap
	role="menubar"
	aria-label={t('menus')}
	{onfocusout}
	onmousedown={(event) => event.preventDefault()}
>
	{#each menus as menu, m (menu.name)}
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
				onclick={() => go(open ? closedOn(m) : openOn(m))}
				onpointerenter={(event) => {
					// Once a menu is open, pointing at another name opens that one. A finger only taps.
					if (event.pointerType === 'mouse' && bar.open && !open) point(openOn(m));
				}}
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
				{#each menu.rows as row, r (row.label)}
					{#if canChoose(row)}
						<a
							class="row"
							role="menuitem"
							id={rowId(m, r)}
							tabindex="-1"
							href={resolve(row.to)}
							target={row.tab}
							onclick={() => go(closedOn(m))}
							onpointermove={() => {
								if (bar.row !== r) point({ ...bar, row: r });
							}}
							{onkeydown}
						>
							{row.label}
						</a>
					{:else}
						<span
							class="row here"
							role="menuitem"
							aria-current="page"
							aria-disabled="true"
							onpointermove={() => {
								if (bar.row !== null) point(openOn(m));
							}}
						>
							{row.label}
						</span>
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
		z-index: 2;
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

	/* A row is a band across the whole width of its menu. */
	.row {
		display: block;
		padding: var(--space-6) var(--space-12);
		color: inherit;
		text-decoration: none;
	}

	/* One row is lit at a time, the one that holds the focus: under the pointer, or chosen with
	   the keys. The row of the screen already shown is lit as well, as if already chosen. */
	.row:focus,
	.here {
		background: var(--hover);
	}
</style>
