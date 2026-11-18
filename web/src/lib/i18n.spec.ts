import { FluentParser } from '@fluent/syntax';
import { describe, expect, it, vi } from 'vitest';
import english from '../../locales/en.ftl?raw';
import { createBundle, formatAround, formatMessage, hasMessage, t, tAround } from './i18n.ts';
import type { WindowAdvice } from './shell/window-size.ts';

describe('locales/en.ftl', () => {
	// The parser of the bundle skips a message it can't read without a word: the full parser
	// keeps it as `Junk`, with what went wrong.
	it('has no syntax error', () => {
		const junk = new FluentParser()
			.parse(english)
			.body.filter((entry) => entry.type === 'Junk')
			.map((entry) => ({
				content: entry.content,
				errors: entry.annotations.map((a) => a.message)
			}));
		expect(junk).toEqual([]);
	});

	it('defines each message once', () => {
		expect(createBundle('en', english).errors).toEqual([]);
	});
});

describe('formatMessage', () => {
	const { bundle } = createBundle('en', 'greeting = Hello, { $name }!\n');

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
	const { bundle } = createBundle(
		'en',
		'size = At least { $least }. This one is { $size }.\nlast = Only { $size }\nplain = Nothing to draw.\n'
	);

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
		expect(t('page-title', { page: 'Sandbox' })).toBe('Sandbox · Stepwise');
	});

	it('formats a message of the interface around one of its values', () => {
		expect(tAround('window-small-size', 'size', { least: '1280 × 720' })).toEqual([
			'At least 1280 × 720 pixels. This one is ',
			'.'
		]);
	});

	it.each(['grow', 'zoom'])('names the key that zooms on each computer, %s', (advice) => {
		expect(t(`window-small-${advice}`, { platform: 'mac' })).toContain('Cmd and −');
		expect(t(`window-small-${advice}`, { platform: 'other' })).toContain('Ctrl and −');
		expect(t(`window-small-${advice}`, { platform: 'chromeos' })).toContain('Ctrl and −');
	});

	it('has a message for each thing to do about a window too small', () => {
		const advices: WindowAdvice[] = ['grow', 'full-screen', 'zoom'];
		for (const advice of advices) expect(hasMessage(`window-small-${advice}`)).toBe(true);
	});

	it('writes a size without a separator of thousands', () => {
		expect(t('window-size', { width: '1280', height: '720' })).toBe('1280 × 720');
	});
});

describe('hasMessage', () => {
	it('knows the messages of the interface', () => {
		expect(hasMessage('app-name')).toBe(true);
		expect(hasMessage('no-such-message')).toBe(false);
	});
});
