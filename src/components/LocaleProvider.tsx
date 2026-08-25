"use client";

import { createContext, useContext } from "react";
import { copy, type Copy } from "@/lib/i18n";

type Ctx = {
  t: Copy;
};

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  return <LocaleCtx.Provider value={{ t: copy.en }}>{children}</LocaleCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
