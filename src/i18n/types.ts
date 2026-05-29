export type Language = 'en' | 'zh';

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

export interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TFunction;
}
