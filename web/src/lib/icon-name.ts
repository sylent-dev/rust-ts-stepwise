// The names of the icons that `icon.svelte` draws. In a file of its own: ESLint reads the types of
// the `.ts` files alone, and a type written in a component reaches another file unknown.

/** The name of an icon. */
export type IconName =
	'arrow-down' | 'arrow-up' | 'check' | 'chevron' | 'close' | 'diamond' | 'gear';
