// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { loadLocale, type Locale, type TranslationMap, availableLocales } from "./locales";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  tRich: (key: string, params?: Record<string, string | number>) => ReactNode;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "upbrr:locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [ready, setReady] = useState(false);

  const loadTranslations = useCallback(async (newLocale: Locale) => {
    try {
      const translationMap = await loadLocale(newLocale);
      setTranslations(translationMap);
      console.log("[i18n] Translations set in state:", translationMap);
      setLocaleState(newLocale);
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (error) {
      console.error(`Failed to load locale ${newLocale}:`, error);
      if (newLocale !== DEFAULT_LOCALE) {
        const fallback = await loadLocale(DEFAULT_LOCALE);
        setTranslations(fallback);
        setLocaleState(DEFAULT_LOCALE);
        localStorage.setItem(STORAGE_KEY, DEFAULT_LOCALE);
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    let initialLocale: Locale = DEFAULT_LOCALE;

    if (stored && availableLocales.includes(stored)) {
      initialLocale = stored;
    } else {
      // Detecta o idioma do navegador
      try {
        const browserLang = navigator.language || navigator.languages?.[0] || "en";
        // Normaliza: "pt-BR" -> "pt-BR", "pt" -> "pt-BR"? Melhor manter match exato.
        const matched = availableLocales.find((locale) => browserLang.startsWith(locale));
        if (matched) {
          initialLocale = matched;
        }
      } catch {
        // fallback silencioso para en
      }
      // Salva a escolha automática para a próxima vez (opcional)
      // localStorage.setItem(STORAGE_KEY, initialLocale);
      // Não salvamos automaticamente para não "travar" o usuário em um idioma que ele não quer.
      // O seletor manual salvará depois.
    }

    loadTranslations(initialLocale)
      .then(() => {
        console.log("[i18n] Translations loaded successfully");
        setReady(true);
      })
      .catch((err) => {
        console.error("[i18n] Failed to load translations:", err);
        setReady(true);
      });
  }, [loadTranslations]);

  const setLocale = async (newLocale: Locale) => {
    await loadTranslations(newLocale);
  };

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: unknown = translations;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          console.warn(`Translation key not found: ${key} (locale: ${locale})`);
          return key;
        }
      }

      if (typeof value !== "string") {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      if (!params) return value;

      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return String(params[paramKey] ?? match);
      });
    },
    [translations, locale],
  );

  const tRich = useCallback(
    (key: string, params?: Record<string, string | number>): ReactNode => {
      const translated = t(key, params);
      return translated;
    },
    [t],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tRich, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
