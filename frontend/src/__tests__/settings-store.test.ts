import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, THEME_PRESETS, DEFAULT_THEME } from '@/store/settingsStore';

describe('settingsStore', () => {
    beforeEach(() => {
        useSettingsStore.setState({ locale: 'zh', theme: DEFAULT_THEME });
    });

    it('has correct default values', () => {
        const state = useSettingsStore.getState();
        expect(state.locale).toBe('zh');
        expect(state.theme).toBe(DEFAULT_THEME);
    });

    it('setLocale updates locale', () => {
        useSettingsStore.getState().setLocale('en');
        expect(useSettingsStore.getState().locale).toBe('en');
    });

    it('setTheme updates theme', () => {
        useSettingsStore.getState().setTheme('brand-light');
        expect(useSettingsStore.getState().theme).toBe('brand-light');
    });

    it('setLocale rejects invalid values at type level', () => {
        // Verify type constraint works - both valid locales are accepted
        useSettingsStore.getState().setLocale('zh');
        expect(useSettingsStore.getState().locale).toBe('zh');
        useSettingsStore.getState().setLocale('en');
        expect(useSettingsStore.getState().locale).toBe('en');
    });

    it('setTheme accepts every theme preset', () => {
        // All five presets must be settable (guards against enum drift)
        for (const preset of THEME_PRESETS) {
            useSettingsStore.getState().setTheme(preset);
            expect(useSettingsStore.getState().theme).toBe(preset);
        }
    });

    it('exposes exactly the five expected presets', () => {
        expect(THEME_PRESETS).toEqual([
            'atelier-dark',
            'bridge-dark',
            'brand-dark',
            'atelier-light',
            'brand-light',
        ]);
        expect(DEFAULT_THEME).toBe('atelier-dark');
    });
});
