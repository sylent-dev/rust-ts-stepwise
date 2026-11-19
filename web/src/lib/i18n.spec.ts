// The reading of the Fluent files and the formatting of a message. The files themselves and the
// names that the code writes are checked by messages.spec.ts.

import { describe, expect, it, vi } from 'vitest';
import { createBundle, findMessage, formatAround, formatMessage, t, tAround } from './i18n.ts';
import { adviceMessage } from './shell/window-size.ts';

describe('createBundle', () => {
	it('reads the files of a language into one bundle', () => {
		const { bundle, errors } = createBundle('en', {
			'en/interface.ftl': 'greeting = Hello!\n',
			'en/levels.ftl': 'title = Paint a square\n'
		});
		expect(errors).toEqual([]);
		expect(formatMessage(bundle, 'greeting')).toBe('Hello!');
		expect(formatMessage(bundle, 'title')).toBe('Paint a square');
	});

	it('keeps the first of two messages of the same name, and says the file of the second', () => {
		const { bundle, errors } = createBundle('en', {
			'en/interface.ftl': 'title = The interface\n',
			'en/levels.ftl': 'title = A level\n'
		});
		expect(formatMessage(bundle, 'title')).toBe('The interface');
		expect(errors.map((error) => error.message)).toEqual([
			expect.stringMatching(/^en\/levels\.ftl: .*"title"/)
		]);
	});
});

describe('formatMessage', () => {
	const { bundle } = createBundle('en', { 'en.ftl': 'greeting = Hello, { $name }!\n' });

	it('fills the values of a message', () => {
		expect(formatMessage(bundle, 'greeting', { name: 'Ada' })).toBe('Hello, Ada!');
	});

	it('shows the name of a missing message and warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(formatMessage(bundle, 'farewell')).toBe('farewell');
		expect(warn).toHaveBeenCalledOnce();
	});

	it('shows the name of a missing value and warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(formatMessage(bundle, 'greeting')).toBe('Hello, {$name}!');
		expect(warn).toHaveBeenCalledOnce();
	});
});

describe('formatAround', () => {
	const { bundle } = createBundle('en', {
		'en.ftl':
			'size = At least { $least }. This one is { $size }.\nlast = Only { $size }\nplain = Nothing to draw.\n'
	});

	it('gives the text before a value and the text after it, the other values filled', () => {
		expect(formatAround(bundle, 'size', 'size', { least: '1280 × 720' })).toEqual([
			'At least 1280 × 720. This one is ',
			'.'
		]);
	});

	it('gives an empty text after a value that ends the message', () => {
		expect(formatAround(bundle, 'last', 'size')).toEqual(['Only ', '']);
	});

	it('gives the whole message before a value that it doesn’t hold', () => {
		expect(formatAround(bundle, 'plain', 'size')).toEqual(['Nothing to draw.', '']);
	});
});

describe('t', () => {
	it('formats the messages of the interface in English', () => {
		expect(t('tab-title', { page: 'Sandbox' })).toBe('Sandbox · Stepwise');
	});

	it('formats a message of the interface around one of its values', () => {
		expect(tAround('window-small-size', 'size', { least: '1280 × 720' })).toEqual([
			'At least 1280 × 720 pixels. This one is ',
			'.'
		]);
	});

	it.each(['grow', 'zoom'] as const)('names the key that zooms on each computer, %s', (advice) => {
		expect(t(adviceMessage(advice), { platform: 'mac' })).toContain('Cmd and −');
		expect(t(adviceMessage(advice), { platform: 'other' })).toContain('Ctrl and −');
		expect(t(adviceMessage(advice), { platform: 'chromeos' })).toContain('Ctrl and −');
	});

	it('writes a size without a separator of thousands', () => {
		expect(t('window-size', { width: '1280', height: '720' })).toBe('1280 × 720');
	});
});

describe('findMessage', () => {
	it('gives the text of a message of the interface', () => {
		expect(findMessage('app-name')).toBe('Stepwise');
	});

	it('gives nothing for a name without message, and doesn’t warn', () => {
		const warn = vi.spyOn(console, 'warn');
		expect(findMessage('no-such-message')).toBeUndefined();
		expect(warn).not.toHaveBeenCalled();
	});
});
