// What the interface has to know of the computer it runs on.

/**
 * The computers that the interface tells apart, by their keys: one of Apple, where the key of
 * the shortcuts is Cmd rather than Ctrl; a Chromebook, whose keyboard has no F11; any other.
 */
export type Platform = 'mac' | 'chromeos' | 'other';

/**
 * The computer, from what the browser says of it: the name it gives to the computer
 * (`navigator.platform`) and the one it gives to itself (`navigator.userAgent`).
 */
export function platformOf(platform: string, userAgent: string): Platform {
	if (/^(Mac|iPhone|iPad|iPod)/.test(platform)) return 'mac';
	if (/\bCrOS\b/.test(userAgent)) return 'chromeos';
	return 'other';
}
