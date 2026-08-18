import type { Locale } from '@/store/settingsStore';
import zh from '../../messages/zh.json';
import en from '../../messages/en.json';

export const SUPPORTED_LOCALES: Locale[] = ['zh', 'en'];

const messages: Record<Locale, typeof zh> = { zh, en };

export function getMessages(locale: Locale) {
    return messages[locale] ?? messages.zh;
}
