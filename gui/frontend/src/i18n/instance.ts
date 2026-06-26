// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import { loadLocale, type Locale, type TranslationMap } from "./locales";

let currentLocale: Locale = "en";
let currentTranslations: TranslationMap = {};

export async function setLocale(locale: Locale) {
  currentLocale = locale;
  currentTranslations = await loadLocale(locale);
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = currentTranslations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key} (locale: ${currentLocale})`);
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
}

// Inicializa com o locale padrão
loadLocale("en").then((data) => {
  currentTranslations = data;
});
