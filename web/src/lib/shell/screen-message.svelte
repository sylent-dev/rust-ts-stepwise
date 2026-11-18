<!-- A message in place of the screen (see Error handling in specs.md): under the head of the
     disappointed robot, a title, then what the screen that shows it puts there, its sentences
     and what it offers to do. Its look is a class of the styles (styles/screen-message.css),
     which the messages written in the page itself share. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { logoDisappointed } from '#lib/elements.ts';

	interface Props {
		title: string;
		/** What the message is about, in two or three signs, hardly there behind it. */
		mark?: string;
		/** On a phone: a smaller head, larger sentences. */
		phone?: boolean;
		children: Snippet;
	}

	let { title, mark, phone = false, children }: Props = $props();
</script>

<main class="screen-message" class:is-phone={phone}>
	{#if mark}<div class="screen-message-mark" aria-hidden="true">{mark}</div>{/if}
	<div class="screen-message-head"><img src={logoDisappointed} alt="" /></div>
	<h1>{title}</h1>
	{@render children()}
</main>
