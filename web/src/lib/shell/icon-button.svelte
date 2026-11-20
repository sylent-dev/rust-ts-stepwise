<!-- A button made of an icon alone: a square, quieter than the text around it until the pointer is
     over it, which says what it does in a tip and to a screen reader. The zone it stands on gives
     its size and its fill, as the mock-up draws each. It places nothing: the block that shows it
     does, around it. Anything else a button takes (`onclick`, `aria-expanded`…) goes to it as it
     is; one that opens something stays lit while it is open. -->
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { IconName } from '#lib/icon-name.ts';
	import Icon from '#lib/icon.svelte';

	/**
	 * Where the button stands: a band (the header), what opens over the screen (a panel), or the
	 * banner of a browser that refuses to save.
	 */
	type Zone = 'band' | 'pop' | 'banner';

	/** What the component writes itself is left out: a caller can't give it twice. */
	type ButtonAttributes = Omit<
		HTMLButtonAttributes,
		'type' | 'class' | 'title' | 'aria-label' | 'children'
	>;

	interface Props extends ButtonAttributes {
		icon: IconName;
		/** What it does, in a word or two: its tip under the pointer, its name for a screen reader. */
		label: string;
		zone: Zone;
	}

	let { icon, label, zone, ...attributes }: Props = $props();

	/** The size of the icon in each zone, in pixels: a zone without its size doesn't compile. */
	const ICON_SIZES = { band: 18, pop: 16, banner: 14 } as const satisfies Record<Zone, number>;
</script>

<button {...attributes} type="button" class={zone} title={label} aria-label={label}>
	<Icon name={icon} size={ICON_SIZES[zone]} />
</button>

<style>
	/* `--side` and `--fill` are set by the zone, below: the side of the square, and its fill
	   under the pointer. */
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

	/* As high as the names of the menus beside it. */
	.band {
		--side: var(--band-item-height);
		--fill: var(--band-hover);
	}

	/* The cross of a panel: 26 pixels, the size of its drawing in the mock-up. */
	.pop {
		--side: 26px;
		--fill: var(--hover);
	}

	/* The cross of the banner: 24 pixels, as in the mock-up. On the amber of the banner, it takes
	   the color of the text, at 70 % until the pointer is over it: the gray of a weak text is
	   made for the zones, and would be hard to see there. */
	.banner {
		--side: 24px;
		--fill: var(--shade);
		color: inherit;
		opacity: 0.7;
	}

	.banner:hover {
		color: inherit;
		opacity: 1;
	}
</style>
