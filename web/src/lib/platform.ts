// What the interface has to know of the computer it runs on.

/**
 * Whether `platform`, the name the browser gives to the computer (`navigator.platform`), is one
 * of Apple, where the key of the shortcuts is Cmd rather than Ctrl.
 */
export function isApple(platform: string): boolean {
	return /^(Mac|iPhone|iPad|iPod)/.test(platform);
}
