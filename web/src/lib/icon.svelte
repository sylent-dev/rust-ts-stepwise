<!-- An icon: lines in the color of the text around it, drawn in a square of 16 units. An icon is
     added to the list with the first block that shows it. -->
<script lang="ts" module>
	/** The lines of each icon, as the `d` of a path. */
	const ICONS = {
		diamond: 'M8 2.2 13.8 8 8 13.8 2.2 8Z'
	} as const;

	/** The name of an icon. */
	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		/** Its width and its height, in pixels. */
		size: number;
	}

	let { name, size }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 16 16"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={ICONS[name]} />
</svg>

<style>
	svg {
		display: block;
	}
</style>
