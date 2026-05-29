import { en } from './en';
import { zh } from './zh';
import type { Language, TFunction } from './types';

const translations: Record<Language, Record<string, string>> = { en, zh };

export function createT(language: Language): TFunction {
  return function t(key: string, params?: Record<string, string | number>): string {
    let text = translations[language][key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

export type { Language, I18nContextValue, TFunction } from './types';
export { en, zh };
