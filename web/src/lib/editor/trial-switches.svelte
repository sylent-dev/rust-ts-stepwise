<!-- TRIAL, to remove before the pull request of step 16b: the switches of the three behaviors
     that the owner decides by trying them (see trial.ts). Its texts are written here, in
     English, since they never reach a learner. -->
<script lang="ts">
	import type { Trial } from './trial.ts';

	interface Props {
		trial: Trial;
	}

	let { trial = $bindable() }: Props = $props();
</script>

<fieldset>
	<legend>To decide by trying</legend>
	<label>
		<input type="checkbox" bind:checked={trial.closePairs} />
		( and " close by themselves
	</label>
	<label>
		<input type="checkbox" bind:checked={trial.matchPairs} />
		The matching parenthesis is lit
	</label>
	<label>
		<input type="checkbox" bind:checked={trial.tabStops} />
		Tab goes to the next stop of four
	</label>
</fieldset>

<style>
	fieldset {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-24);
		margin: 0;
		padding: var(--space-6) var(--space-12);
		border: 0;
		background: var(--band);
		font-size: var(--size-small);
	}

	legend {
		float: left;
		padding: 0;
		font-weight: var(--weight-strong);
	}
</style>
