"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { copy, type Copy, type Locale } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Copy;
};

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
  };

  const value = useMemo(
    () => ({ locale, setLocale, t: copy[locale] as Copy }),
    [locale],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
