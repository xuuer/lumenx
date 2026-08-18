import { describe, it, expect } from 'vitest';
import { getMessages, SUPPORTED_LOCALES } from '@/lib/i18n';

describe('i18n configuration', () => {
    it('SUPPORTED_LOCALES contains zh and en', () => {
        expect(SUPPORTED_LOCALES).toContain('zh');
        expect(SUPPORTED_LOCALES).toContain('en');
        expect(SUPPORTED_LOCALES).toHaveLength(2);
    });

    it('getMessages returns messages for zh', () => {
        const messages = getMessages('zh');
        expect(messages).toBeDefined();
        expect(messages.common.save).toBe('保存');
        expect(messages.nav.workspace).toBe('工作区');
        expect(messages.settings.title).toBe('设置');
    });

    it('getMessages returns messages for en', () => {
        const messages = getMessages('en');
        expect(messages).toBeDefined();
        expect(messages.common.save).toBe('Save');
        expect(messages.nav.workspace).toBe('Workspace');
        expect(messages.settings.title).toBe('Settings');
    });

    it('zh and en have identical key structure', () => {
        const zh = getMessages('zh');
        const en = getMessages('en');

        const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
            return Object.entries(obj).flatMap(([key, value]) => {
                const path = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null) {
                    return getKeys(value as Record<string, unknown>, path);
                }
                return [path];
            });
        };

        const zhKeys = getKeys(zh).sort();
        const enKeys = getKeys(en).sort();
        expect(zhKeys).toEqual(enKeys);
    });

    it('getMessages falls back to zh for unknown locale', () => {
        // @ts-expect-error testing invalid input
        const messages = getMessages('fr');
        expect(messages.common.save).toBe('保存');
    });
});
