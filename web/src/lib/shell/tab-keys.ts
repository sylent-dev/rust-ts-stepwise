// The keys of a row of tabs, as those of a web page (the pattern of WAI-ARIA): Tab stops on the tab
// shown, the arrows go to the tab beside it, from the last to the first and back, Home and End to
// the first and the last; each shows its panel. The tabs of the panels under the map and those of
// the maps of a level read them here. Without a page, so that each key is tested.

/** What a press of a key says of itself: the key, and the keys held with it. */
export type TabPress = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>;

/**
 * The place of the tab that a press goes to, among `count` tabs, from the one shown at `index`
 * (both from 0); nothing for another key. Alt+← goes back a page, and a shortcut of the screen holds
 * Ctrl: only the keys alone.
 */
export function tabAfter(press: TabPress, index: number, count: number): number | undefined {
	if (press.ctrlKey || press.altKey || press.metaKey) return undefined;
	switch (press.key) {
		case 'ArrowLeft':
			return (index - 1 + count) % count;
		case 'ArrowRight':
			return (index + 1) % count;
		case 'Home':
			return 0;
		case 'End':
			return count - 1;
		default:
			return undefined;
	}
}
