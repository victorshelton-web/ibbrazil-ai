"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DeskView } from "./DeskMenu";

type DeskCtx = {
  view: DeskView;
  setView: (view: DeskView) => void;
  noticeQuery: string;
  openComunicado: (ticker: string) => void;
};

const DeskCtx = createContext<DeskCtx | null>(null);

export function displayTicker(symbol: string): string {
  if (symbol === "^BVSP") return "IBOV";
  return symbol.replace(/\.SA$/, "");
}

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<DeskView>("news");
  const [noticeQuery, setNoticeQuery] = useState("");

  const setView = useCallback((next: DeskView) => {
    setViewState(next);
    if (next !== "comunicados") setNoticeQuery("");
  }, []);

  const openComunicado = useCallback((ticker: string) => {
    const label = displayTicker(ticker);
    setNoticeQuery(label);
    setViewState("comunicados");
    window.requestAnimationFrame(() => {
      document.getElementById("comunicados-b3")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const value = useMemo(
    () => ({ view, setView, noticeQuery, openComunicado }),
    [view, setView, noticeQuery, openComunicado],
  );

  return <DeskCtx.Provider value={value}>{children}</DeskCtx.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskCtx);
  if (!ctx) throw new Error("useDesk must be used within DeskProvider");
  return ctx;
}
