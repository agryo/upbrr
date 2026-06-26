// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

export type Locale = "en" | "pt-BR";

export type TranslationMap = Record<string, unknown>;

export const availableLocales: Locale[] = ["en", "pt-BR"];

const localeCache = new Map<Locale, TranslationMap>();

export async function loadLocale(locale: Locale): Promise<TranslationMap> {
  if (localeCache.has(locale)) {
    console.log(`[i18n] Using cached locale: ${locale}`, localeCache.get(locale));
    return localeCache.get(locale)!;
  }

  try {
    const response = await fetch(`/locales/${locale}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load locale ${locale}: ${response.statusText}`);
    }
    const data = (await response.json()) as TranslationMap;
    console.log(`[i18n] Loaded locale: ${locale}`, data);
    localeCache.set(locale, data);
    return data;
  } catch (error) {
    console.error(`Error loading locale ${locale}:`, error);
    if (locale !== "en") {
      return loadLocale("en");
    }
    return {};
  }
}

export function clearLocaleCache(): void {
  localeCache.clear();
}

export function getCachedLocale(locale: Locale): TranslationMap | undefined {
  return localeCache.get(locale);
}
