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

	/**
	 * Where the button stands: a band (the header), what opens over the screen (a panel), or the
	 * banner of a browser that refuses to save.
	 */
	type Zone = 'band' | 'pop' | 'banner';

	/**
	 * What the component writes itself is left out, so that a caller can't give it twice, and what
	 * would go around it: a look or a place of its own (`style`), a name that a screen reader
	 * would read in place of the tip (`aria-labelledby`).
	 */
	type ButtonAttributes = Omit<
		HTMLButtonAttributes,
		'type' | 'class' | 'style' | 'title' | 'aria-label' | 'aria-labelledby' | 'children'
	>;

	interface Props extends ButtonAttributes {
		icon: IconName;
		/** What it does, in a word or two: its tip under the pointer, its name for a screen reader. */
		label: string;
		zone: Zone;
	}

	let { icon, label, zone, ...attributes }: Props = $props();

	/**
	 * The look of each zone: the size of its icon, in pixels, the side of its square and its fill
	 * under the pointer. A zone without one of them doesn't compile.
	 */
	const LOOKS = {
		// As high as the names of the menus beside it.
		band: { icon: 18, side: 'var(--band-item-height)', fill: 'var(--band-hover)' },
		// The cross of a panel: 26 pixels, the size of its drawing in the mock-up.
		pop: { icon: 16, side: '26px', fill: 'var(--hover)' },
		// The cross of the banner: 24 pixels, as in the mock-up.
		banner: { icon: 14, side: '24px', fill: 'var(--shade)' }
	} as const satisfies Record<Zone, { icon: number; side: string; fill: string }>;

	const look = $derived(LOOKS[zone]);

	/**
	 * The browser presses a button again at each repeat of Enter held down: a button that opens
	 * and closes, or runs and pauses, would do both many times a second. Space presses once by
	 * itself, as it is let go.
	 */
	const onkeydown: ButtonAttributes['onkeydown'] = (event) => {
		if (event.repeat && event.key === 'Enter') event.preventDefault();
		attributes.onkeydown?.(event);
	};
</script>

<button
	{...attributes}
	{onkeydown}
	type="button"
	class={zone}
	style:--side={look.side}
	style:--fill={look.fill}
	title={label}
	aria-label={label}
>
	<Icon name={icon} size={look.icon} />
</button>

<style>
	/* `--side` and `--fill` come from the look of the zone, above: the side of the square, and
	   its fill under the pointer. */
	button {
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

	button:hover,
	button[aria-expanded='true'] {
		background: var(--fill);
		color: var(--text);
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
</style>
