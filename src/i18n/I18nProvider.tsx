import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createT } from './index';
import type { I18nContextValue, Language } from './types';

const DEFAULT_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'fishy.language';

function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'zh';
}

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: createT(DEFAULT_LANGUAGE),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isLanguage(stored)) {
          setLanguageState(stored);
        }
      })
      .catch(() => {
        // Storage read failed — keep default language, do not crash
      });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {
      // Storage write failed — state still updated in memory
    });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: createT(language),
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
