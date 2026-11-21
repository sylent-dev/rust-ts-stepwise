<!-- TRIAL, to remove before the pull request of step 16b: the choice of what Enter does between
     a sign and the one that closes it (see trial.ts). Its texts are written here, in English,
     since they never reach a learner. -->
<script lang="ts">
	import type { EnterInPair } from './trial.ts';

	interface Props {
		enter: EnterInPair;
	}

	let { enter = $bindable() }: Props = $props();
</script>

<fieldset>
	<legend>To decide by trying: Enter in forward(|)</legend>
	<label><input type="radio" bind:group={enter} value="finish" /> 1. finishes the line</label>
	<label><input type="radio" bind:group={enter} value="spread" /> 2. three lines, as VS Code</label>
	<label><input type="radio" bind:group={enter} value="split" /> 3. two lines</label>
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
