// The messages of a level in the console, once a program has ended without error (see Console in
// specs.md): one per goal not met, in the order of the goals, or the map passed with what comes
// next. Without a page, so that each case is tested; the console draws them (console-panel.svelte).

import type { ConsoleNote } from '#lib/console/console-log.svelte.ts';
import type { Color, GoalNotMet } from '#lib/core/core.ts';
import { t } from '#lib/i18n.ts';
import { mapToTry } from '#lib/progress/progress.ts';

/**
 * A goal not met as the console counts it: the cells of a paint together, one note per paint,
 * and those of each other goal together.
 */
type GoalGroup =
	| { readonly goal: 'place' | 'painted' | 'item' | 'not-carrying' | 'carrying' }
	| { readonly goal: 'paint'; readonly color: Color };

/** The group of a goal not met. */
function groupOf(goal: GoalNotMet): GoalGroup {
	switch (goal.type) {
		case 'robot-not-at':
			return { goal: 'place' };
		case 'paint-missing':
			return { goal: 'paint', color: goal.color };
		case 'painted-elsewhere':
			return { goal: 'painted' };
		case 'item-missing':
			return { goal: 'item' };
		case 'not-carrying':
			return { goal: 'not-carrying' };
		case 'carrying':
			return { goal: 'carrying' };
	}
}

/** The sentence of a group of `count` goals not met. */
function groupText(group: GoalGroup, count: number): string {
	switch (group.goal) {
		case 'place':
			return t('console-goal-place');
		case 'paint':
			return t('console-goal-paint', { count, color: group.color });
		case 'painted':
			return t('console-goal-painted', { count });
		case 'item':
			return t('console-goal-item', { count });
		case 'not-carrying':
			return t('console-goal-not-carrying');
		case 'carrying':
			return t('console-goal-carrying');
	}
}

/**
 * What the console says of the goals not met, as the core gives them, in the order of the goals:
 * one note per group, where its first goal stands.
 */
export function goalNotes(goals: readonly GoalNotMet[]): ConsoleNote[] {
	const counts = new Map<string, { group: GoalGroup; count: number }>();
	for (const goal of goals) {
		const group = groupOf(goal);
		const key = group.goal === 'paint' ? `paint-${group.color}` : group.goal;
		const counted = counts.get(key);
		counts.set(key, { group, count: (counted?.count ?? 0) + 1 });
	}
	return [...counts.values()].map(({ group, count }) => ({
		kind: 'goal',
		text: groupText(group, count)
	}));
}

/**
 * What the console says once the map numbered `map` has passed, among the `count` maps of its
 * level, `passed` being the maps that the same code has passed now, this one included: the map to
 * try next, or the level done. A level of one map shows no tab, so no number names its map.
 */
export function passedNote(map: number, count: number, passed: ReadonlySet<number>): ConsoleNote {
	const next = mapToTry(passed, count);
	const text =
		count === 1
			? t('console-level-done')
			: next === undefined
				? t('console-map-passed-done', { map })
				: t('console-map-passed', { map, next });
	return { kind: 'passed', text };
}
