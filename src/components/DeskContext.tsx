"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CadeFeed } from "@/lib/cade";
import type { FatosFeed } from "@/lib/fatos-relevantes";
import type { FeedItem, PartyQuote } from "@/lib/types";
import type { DeskView } from "./DeskMenu";

export type TickerHits = Record<DeskView, number>;

type DeskCatalog = {
  items: FeedItem[];
  fatos: FatosFeed;
  comunicados: FatosFeed;
  cade: CadeFeed;
};

type DeskCtx = {
  view: DeskView;
  setView: (view: DeskView) => void;
  tickerQuery: string;
  hits: TickerHits;
  openTicker: (ticker: string) => void;
  clearTicker: () => void;
};

const DeskCtx = createContext<DeskCtx | null>(null);

const VIEW_ORDER: DeskView[] = ["comunicados", "fatos", "cade", "news"];

const SECTION_ID: Record<DeskView, string> = {
  news: "news-board",
  fatos: "fatos-b3",
  comunicados: "comunicados-b3",
  cade: "cade-ac",
};

export function displayTicker(symbol: string): string {
  if (symbol === "^BVSP") return "IBOV";
  return symbol.replace(/\.SA$/, "");
}

export function tickerKey(symbol: string): string {
  return displayTicker(symbol).toLowerCase();
}

export function quotesMatchTicker(quotes: PartyQuote[] | undefined, ticker: string): boolean {
  const q = tickerKey(ticker);
  return (quotes || []).some((row) => tickerKey(row.ticker) === q);
}

function newsMatches(item: FeedItem, ticker: string): boolean {
  const q = tickerKey(ticker);
  if (quotesMatchTicker(item.acquirerQuotes, ticker) || quotesMatchTicker(item.targetQuotes, ticker)) {
    return true;
  }
  return [item.headline, item.acquirer, item.target, item.highlights].join(" ").toLowerCase().includes(q);
}

function countHits(catalog: DeskCatalog, ticker: string): TickerHits {
  if (!ticker) return { news: 0, fatos: 0, comunicados: 0, cade: 0 };
  return {
    news: catalog.items.filter((item) => newsMatches(item, ticker)).length,
    fatos: catalog.fatos.items.filter(
      (item) =>
        quotesMatchTicker(item.quotes, ticker) ||
        `${item.company} ${item.subject}`.toLowerCase().includes(tickerKey(ticker)),
    ).length,
    comunicados: catalog.comunicados.items.filter(
      (item) =>
        quotesMatchTicker(item.quotes, ticker) ||
        `${item.company} ${item.subject}`.toLowerCase().includes(tickerKey(ticker)),
    ).length,
    cade: catalog.cade.items.filter(
      (item) =>
        quotesMatchTicker(item.quotes, ticker) ||
        `${item.title} ${item.summary}`.toLowerCase().includes(tickerKey(ticker)),
    ).length,
  };
}

function scrollToView(view: DeskView) {
  window.requestAnimationFrame(() => {
    document.getElementById(SECTION_ID[view])?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function DeskProvider({
  catalog,
  children,
}: {
  catalog: DeskCatalog;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<DeskView>("news");
  const [tickerQuery, setTickerQuery] = useState("");

  const hits = useMemo(() => countHits(catalog, tickerQuery), [catalog, tickerQuery]);

  const openTicker = useCallback(
    (ticker: string) => {
      const label = displayTicker(ticker);
      const nextHits = countHits(catalog, label);
      const stay = nextHits[view] > 0 ? view : VIEW_ORDER.find((id) => nextHits[id] > 0) || view;
      setTickerQuery(label);
      setView(stay);
      scrollToView(stay);
    },
    [catalog, view],
  );

  const clearTicker = useCallback(() => setTickerQuery(""), []);

  const value = useMemo(
    () => ({ view, setView, tickerQuery, hits, openTicker, clearTicker }),
    [view, tickerQuery, hits, openTicker, clearTicker],
  );

  return <DeskCtx.Provider value={value}>{children}</DeskCtx.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskCtx);
  if (!ctx) throw new Error("useDesk must be used within DeskProvider");
  return ctx;
}
