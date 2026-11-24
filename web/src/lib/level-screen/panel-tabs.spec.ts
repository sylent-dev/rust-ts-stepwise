import { describe, expect, it } from 'vitest';
import { PanelTabs } from './panel-tabs.svelte.ts';

/** The panel shown, and whether the tab of the variables has its dot. */
function seen(tabs: PanelTabs) {
	return { shown: tabs.shown, dot: tabs.dot };
}

describe('the tabs of the panels under the map', () => {
	it('show the console at first, without a dot', () => {
		expect(seen(new PanelTabs())).toEqual({ shown: 'console', dot: false });
	});

	it('show the console as the program starts, then the variables at a pause', () => {
		const tabs = new PanelTabs();
		tabs.choose('variables');
		tabs.started();
		tabs.follow('running');
		expect(seen(tabs)).toEqual({ shown: 'console', dot: false });
		tabs.follow('paused');
		expect(seen(tabs)).toEqual({ shown: 'variables', dot: false });
	});

	it('keep the console at a pause once the learner has chosen it, until the next start', () => {
		const tabs = new PanelTabs();
		tabs.started();
		tabs.follow('paused');
		tabs.choose('console');
		tabs.follow('running');
		tabs.follow('paused');
		expect(seen(tabs)).toEqual({ shown: 'console', dot: false });
		tabs.started();
		tabs.follow('paused');
		expect(seen(tabs)).toEqual({ shown: 'variables', dot: false });
	});

	it('keep the panel shown while the program runs, and once it has ended', () => {
		const tabs = new PanelTabs();
		tabs.started();
		tabs.follow('paused');
		tabs.follow('running');
		tabs.follow('ended');
		expect(seen(tabs)).toEqual({ shown: 'variables', dot: false });
	});

	it('bring the console forward at an error, the variables shown or not, with a dot', () => {
		const tabs = new PanelTabs();
		tabs.started();
		tabs.follow('paused');
		tabs.follow('failed');
		expect(seen(tabs)).toEqual({ shown: 'console', dot: true });
	});

	it('take the dot away once the variables are opened', () => {
		const tabs = new PanelTabs();
		tabs.started();
		tabs.follow('failed');
		tabs.choose('console');
		expect(seen(tabs)).toEqual({ shown: 'console', dot: true });
		tabs.choose('variables');
		expect(seen(tabs)).toEqual({ shown: 'variables', dot: false });
		tabs.choose('console');
		expect(seen(tabs)).toEqual({ shown: 'console', dot: false });
	});

	it('show the console when it lists the errors of the code, the dot kept', () => {
		const tabs = new PanelTabs();
		tabs.started();
		tabs.follow('failed');
		tabs.choose('variables');
		tabs.follow('failed');
		tabs.listed();
		expect(seen(tabs)).toEqual({ shown: 'console', dot: true });
	});

	it('take the dot away when the program starts again, or the map is put back', () => {
		const tabs = new PanelTabs();
		tabs.started();
		tabs.follow('failed');
		tabs.started();
		expect(seen(tabs)).toEqual({ shown: 'console', dot: false });
		tabs.follow('failed');
		tabs.follow('ready');
		expect(seen(tabs)).toEqual({ shown: 'console', dot: false });
	});
});
