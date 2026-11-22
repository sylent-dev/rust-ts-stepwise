// The speeds of a program as the level screen offers them (see Running a program in specs.md):
// their names, and the choices of **Run › Speed**. The speed is a setting: the screen gives what
// reads it and what chooses it, so that nothing here knows where it is kept.

import { t } from '#lib/i18n.ts';
import { isInstant, SPEEDS } from '#lib/run/pace.ts';
import type { Choice } from '#lib/shell/menus.ts';

/** The speed of the programs, as the screen reads it and chooses it. */
export interface SpeedSetting {
	/** The speed in use, in steps per second: one of the list. It follows the setting. */
	readonly current: number;
	/** Takes a speed of the list as the one in use. */
	choose(speed: number): void;
}

/** The name of a speed: `5 steps per second`, `Instant`. */
export function speedName(speed: number): string {
	return isInstant(speed) ? t('speed-instant') : t('speed-steps', { steps: speed });
}

/** The speeds as the choices of **Run › Speed**, from the slowest, the one in use marked. */
export function speedChoices(setting: SpeedSetting): Choice[] {
	return SPEEDS.map((speed) => ({
		id: isInstant(speed) ? 'speed-instant' : `speed-${String(speed)}`,
		label: speedName(speed),
		get chosen() {
			return setting.current === speed;
		},
		choose() {
			setting.choose(speed);
		}
	}));
}
