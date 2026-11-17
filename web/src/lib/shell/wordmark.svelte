<!-- The name beside the logo (see Look of the world in specs.md): the head of the robot is 1.25
     times as tall as the capitals, its middle meets the middle of the lowercase letters, raised by
     0.011 em, and the name starts 0.3 em after it. It only draws: the screen decides whether it
     is a link. -->
<script lang="ts">
	import { logo } from '#lib/elements.ts';
	import { t } from '#lib/i18n.ts';
</script>

<span class="wordmark">
	<img src={logo} alt="" />
	<span>{t('app-name')}</span>
</span>

<style>
	.wordmark {
		/* The heights of a capital and of a lowercase letter of Fredoka in semi-bold, in em: what
		   a browser measures for `S` and `x` (step 13a). */
		--capital: 0.71;
		--lowercase: 0.51;
		--head: calc(var(--capital) * 1.25em);

		/* In a band, the baseline of the name sits 1 pixel under the one of the menus, the head of
		   the robot on the center of the band. */
		position: relative;
		top: -2px;
		display: flex;
		align-items: baseline;
		font: var(--weight-strong) 21px / 1 var(--font-name);
		text-transform: lowercase;
		white-space: nowrap;
	}

	/* The head stands on the baseline, then goes down until its middle meets the one of the
	   lowercase letters. */
	img {
		height: var(--head);
		margin-right: 0.3em;
		transform: translateY(calc(var(--head) / 2 - var(--lowercase) * 0.5em - 0.011em));
	}
</style>
