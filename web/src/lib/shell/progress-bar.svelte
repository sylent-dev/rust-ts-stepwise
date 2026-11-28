<!-- The bar of the progress, along the bottom of the header of a level and of the home screen (see
     Level screen in specs.md): it fills with the levels done, in the teal of what has passed, and
     says how many under the pointer, discreetly, as the tip of the browser. -->
<script lang="ts">
	import { t } from '#lib/i18n.ts';

	interface Props {
		/** How many levels are done. */
		done: number;
		/** How many levels there are. */
		total: number;
	}

	let { done, total }: Props = $props();

	/** *"17 of 20 levels done"*. */
	const text = $derived(t('progress-done', { done, total }));
</script>

<div
	class="progress"
	role="progressbar"
	aria-label={t('progress-name')}
	aria-valuemin={0}
	aria-valuemax={total}
	aria-valuenow={done}
	aria-valuetext={text}
	title={text}
>
	<div class="fill" style:width="{total > 0 ? (100 * done) / total : 0}%"></div>
</div>

<style>
	/* Along the whole bottom of the header, under its content. The pointer finds it on 3 pixels
	   more above it, where the header holds nothing: the bar alone is hard to aim at. */
	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		box-sizing: content-box;
		height: var(--progress-height);
		padding-top: var(--progress-height);
		background: linear-gradient(var(--progress-track), var(--progress-track)) bottom / 100%
			var(--progress-height) no-repeat;
	}

	.fill {
		height: 100%;
		background: var(--passed);
	}
</style>
