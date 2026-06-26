// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import { useI18n } from "./context";
import type { Locale } from "./locales";

export function useTranslation() {
  const { t, tRich, locale, setLocale, ready } = useI18n();

  return {
    t,
    tRich,
    locale,
    setLocale,
    ready,
    isReady: ready,
  };
}

export function useLocale(): Locale {
  const { locale } = useI18n();
  return locale;
}

export function useSetLocale() {
  const { setLocale } = useI18n();
  return setLocale;
}