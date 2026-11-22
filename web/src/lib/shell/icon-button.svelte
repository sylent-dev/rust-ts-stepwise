<!-- A button made of an icon alone: a square, quieter than the text around it until the pointer is
     over it, which says what it does in a tip and to a screen reader. The zone it stands on gives
     its size and its fill, as the mock-up draws each. It places nothing: the block that shows it
     does, around it. Anything else a button takes (`onclick`, `aria-expanded`…) goes to it as it
     is; one that opens something stays lit while it is open. Enter held down presses it once,
     as a shortcut held down runs its command once (see Level screen in specs.md). -->
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { IconName } from '#lib/icon-name.ts';
	import Icon from '#lib/icon.svelte';
	import { currentPlatform } from '#lib/platform.ts';
	import { type Shortcut, spokenShortcut } from './commands.ts';
	import ShortcutKeys from './shortcut-keys.svelte';

	/**
	 * Where the button stands: a band (the header), what opens over the screen (a panel), the
	 * banner of a browser that refuses to save, or the corner of the code, where the controls of
	 * a program float over it.
	 */
	type Zone = 'band' | 'pop' | 'banner' | 'code';

	/**
	 * What the component writes itself is left out, so that a caller can't give it twice, and what
	 * would go around it: a look or a place of its own (`style`), a name that a screen reader
	 * would read in place of the tip (`aria-labelledby`), a button that can't run taken out of
	 * the keys of the page (`disabled`) rather than greyed.
	 */
	type ButtonAttributes = Omit<
		HTMLButtonAttributes,
		| 'type'
		| 'class'
		| 'style'
		| 'title'
		| 'aria-label'
		| 'aria-labelledby'
		| 'aria-describedby'
		| 'aria-keyshortcuts'
		| 'aria-disabled'
		| 'disabled'
		| 'children'
	>;

	interface Props extends ButtonAttributes {
		icon: IconName;
		/** What it does, in a word or two: its tip under the pointer, its name for a screen reader. */
		label: string;
		zone: Zone;
		/** The one in amber among its neighbors, what to do: **Run** among the controls. */
		main?: boolean;
		/**
		 * Whether its command can't run now: its icon fades, it never fills under the pointer, and
		 * a click on it, or Enter, does nothing. It keeps the focus of the keyboard, and its tip.
		 */
		greyed?: boolean;
		/** The shortcut of its command, in its tip beside its name, where the zone draws a tip. */
		shortcut?: Shortcut;
		/** A sentence that says more than its name, under it in its tip, where the zone draws one. */
		help?: string;
	}

	let {
		icon,
		label,
		zone,
		main = false,
		greyed = false,
		shortcut,
		help,
		...attributes
	}: Props = $props();

	/**
	 * The look of each zone: the size of its icon, in pixels, the side of its square, its fill
	 * under the pointer, and whether it draws its own tip, which gives the shortcut of its
	 * command, where the tip of the browser gives a name alone. A zone without one of them
	 * doesn't compile.
	 */
	const LOOKS = {
		// As high as the names of the menus beside it.
		band: { icon: 18, side: 'var(--band-item-height)', fill: 'var(--band-hover)', ownTip: false },
		// The cross of a panel: 26 pixels, the size of its drawing in the mock-up.
		pop: { icon: 16, side: '26px', fill: 'var(--hover)', ownTip: false },
		// The cross of the banner: 24 pixels, as in the mock-up.
		banner: { icon: 14, side: '24px', fill: 'var(--shade)', ownTip: false },
		// A control keeps its fill under the pointer, as in the mock-up: its tip answers there.
		code: { icon: 20, side: 'var(--control-side)', fill: 'var(--control)', ownTip: true }
	} as const satisfies Record<Zone, { icon: number; side: string; fill: string; ownTip: boolean }>;

	const look = $derived(LOOKS[zone]);

	const id = $props.id();
	/** The sentence of the tip, for a screen reader, which reads it after the name. */
	const helpId = `${id}-help`;

	/**
	 * The browser presses a button again at each repeat of Enter held down: a button that opens
	 * and closes, or runs and pauses, would do both many times a second. Space presses once by
	 * itself, as it is let go.
	 */
	const onkeydown: ButtonAttributes['onkeydown'] = (event) => {
		if (event.repeat && event.key === 'Enter') event.preventDefault();
		attributes.onkeydown?.(event);
	};

	/** The tip drawn by the button, if its zone draws one. */
	let tip = $state<HTMLElement>();

	/**
	 * A greyed button does nothing, by the pointer as by the keys, which click it too, nor does
	 * a click on its tip, which stands in it so that the pointer can rest on it.
	 */
	const onclick: ButtonAttributes['onclick'] = (event) => {
		if (greyed || (event.target instanceof Node && tip?.contains(event.target))) return;
		attributes.onclick?.(event);
	};

	/**
	 * Whether the pointer is over the button or its tip, and whether the keyboard is on it: read
	 * by the handlers alone, so no signal.
	 */
	let pointed = false;
	let focused = false;

	/**
	 * Whether Escape has put the tip away, while it covers what is above it, until the pointer
	 * and the keyboard have both left the button: a tip of our own is closed without moving
	 * either, as the tip of the browser is (WCAG 1.4.13). Escape is heard on the window, since the
	 * keyboard may be in the code while the pointer rests on the button; it does there what it
	 * does anyway.
	 */
	let tipAway = $state(false);

	function putTipAway(event: KeyboardEvent) {
		if (event.key === 'Escape' && (pointed || focused)) tipAway = true;
	}

	const onpointerenter: ButtonAttributes['onpointerenter'] = (event) => {
		pointed = true;
		attributes.onpointerenter?.(event);
	};

	const onpointerleave: ButtonAttributes['onpointerleave'] = (event) => {
		pointed = false;
		if (!focused) tipAway = false;
		attributes.onpointerleave?.(event);
	};

	const onfocus: ButtonAttributes['onfocus'] = (event) => {
		focused = true;
		attributes.onfocus?.(event);
	};

	const onblur: ButtonAttributes['onblur'] = (event) => {
		focused = false;
		if (!pointed) tipAway = false;
		attributes.onblur?.(event);
	};
</script>

<svelte:window onkeydown={look.ownTip ? putTipAway : undefined} />

<button
	{...attributes}
	{onkeydown}
	{onclick}
	{onpointerenter}
	{onpointerleave}
	{onfocus}
	{onblur}
	type="button"
	class={zone}
	class:main
	class:tip-away={tipAway}
	style:--side={look.side}
	style:--fill={look.fill}
	title={look.ownTip ? undefined : label}
	aria-label={label}
	aria-keyshortcuts={look.ownTip && shortcut
		? spokenShortcut(shortcut, currentPlatform())
		: undefined}
	aria-describedby={look.ownTip && help !== undefined ? helpId : undefined}
	aria-disabled={greyed || undefined}
>
	<Icon name={icon} size={look.icon} />
	{#if look.ownTip}
		<!-- Read by the eyes alone: the button gives its name and its shortcut to a screen reader
		     itself, and its sentence by its place here. -->
		<span class="tip" aria-hidden="true" bind:this={tip}>
			<span class="tip-name">
				<strong>{label}</strong>
				{#if shortcut}
					<ShortcutKeys {shortcut} />
				{/if}
			</span>
			{#if help !== undefined}
				<small id={helpId}>{help}</small>
			{/if}
		</span>
	{/if}
</button>

<style>
	/* `--side` and `--fill` come from the look of the zone, above: the side of the square, and
	   its fill under the pointer. */
	button {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--side);
		height: var(--side);
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: none;
		color: var(--weak);
	}

	button:not([aria-disabled='true']):hover,
	button[aria-expanded='true'] {
		background: var(--fill);
		color: var(--text);
	}

	/* Greyed: its icon at 35 %, a value of the mock-up tuned by eye, its tip as it is. */
	button[aria-disabled='true'] {
		cursor: not-allowed;
	}

	button[aria-disabled='true'] > :global(svg) {
		opacity: 0.35;
	}

	/* What a zone doesn't share with the others is a class of its name. On the amber of the
	   banner, the cross takes the color of the text, at 70 % until the pointer is over it: the
	   gray of a weak text is made for the zones, and would be hard to see there. */
	.banner {
		color: inherit;
		opacity: 0.7;
	}

	.banner:hover {
		color: inherit;
		opacity: 1;
	}

	/* A control floats over the code: filled and in the color of the text at rest, with its
	   shadow; the main one in amber, lighter under the pointer as a main button. */
	.code {
		background: var(--control);
		color: var(--text);
		box-shadow: var(--control-shadow);
	}

	.code.main {
		background: var(--accent);
		color: var(--on-accent);
	}

	.code.main:not([aria-disabled='true']):hover {
		background: var(--accent-hover);
		color: var(--on-accent);
	}

	/* The tip of a zone that draws its own, under the pointer or the keyboard: over the button,
	   against its right edge, as the mock-up draws the controls in the corner of the code. The
	   pointer may rest on it, the room between them included, to read it closely; it presses
	   nothing there. */
	.tip {
		display: none;
		position: absolute;
		right: 0;
		bottom: calc(100% + var(--space-8));
		padding: var(--space-6) var(--space-12);
		border: var(--pop-border);
		border-radius: var(--radius);
		background: var(--pop);
		color: var(--text);
		box-shadow: var(--pop-shadow);
		font: var(--weight-text) var(--size-text) / var(--line-text) var(--font-text);
		text-align: left;
		white-space: nowrap;
		cursor: default;
	}

	/* The room between the tip and its button, where the pointer passes from one to the other:
	   the distance of the tip and the 1 pixel of its border. */
	.tip::after {
		content: '';
		position: absolute;
		top: 100%;
		right: 0;
		left: 0;
		height: calc(var(--space-8) + 1px);
	}

	button:not(.tip-away):hover > .tip,
	button:not(.tip-away):focus-visible > .tip {
		display: block;
	}

	.tip-name {
		display: flex;
		align-items: center;
		gap: var(--space-12);
	}

	.tip strong {
		font-weight: var(--weight-strong);
	}

	.tip small {
		display: block;
		color: var(--weak);
		font-size: var(--size-small);
	}
</style>
