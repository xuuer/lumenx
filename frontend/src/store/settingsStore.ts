import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh' | 'en';

/**
 * 5 预设主题（Tasty Sam 主题系统）。
 * 3 暗（atelier-dark 默认 / bridge-dark / brand-dark）+ 2 亮（atelier-light / brand-light）。
 * 与 globals.css 的 html.<id> block、Providers/layout 切换逻辑一一对应。
 */
export type ThemePreset =
    | 'atelier-dark'
    | 'bridge-dark'
    | 'brand-dark'
    | 'atelier-light'
    | 'brand-light';

export const THEME_PRESETS: ThemePreset[] = [
    'atelier-dark',
    'bridge-dark',
    'brand-dark',
    'atelier-light',
    'brand-light',
];

export const DEFAULT_THEME: ThemePreset = 'atelier-dark';

interface SettingsStore {
    locale: Locale;
    theme: ThemePreset;
    // 全局动效开关。true = 启用 motion（默认）；false = 降低动效，
    // 由 Providers 挂载 html.no-motion 类来落地（无障碍/性能偏好）。
    animations: boolean;
    setLocale: (locale: Locale) => void;
    setTheme: (theme: ThemePreset) => void;
    setAnimations: (animations: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            locale: 'zh',
            theme: DEFAULT_THEME,
            animations: true,
            setLocale: (locale: Locale) => set({ locale }),
            setTheme: (theme: ThemePreset) => set({ theme }),
            setAnimations: (animations: boolean) => set({ animations }),
        }),
        {
            name: 'lumenx-settings',
            version: 1,
            // v0→v1：旧版只有 'dark' | 'light'。按产品决策，统一升级到新默认
            // atelier-dark（不保留旧观感）。非法/缺失值同样回落默认。
            migrate: (persisted: unknown, version: number) => {
                const state = (persisted ?? {}) as Partial<SettingsStore>;
                const animations = typeof state.animations === 'boolean' ? state.animations : true;
                if (version < 1 || !THEME_PRESETS.includes(state.theme as ThemePreset)) {
                    return { ...state, theme: DEFAULT_THEME, animations } as SettingsStore;
                }
                return { ...state, animations } as SettingsStore;
            },
        }
    )
);
