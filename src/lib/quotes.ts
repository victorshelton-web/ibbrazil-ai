import type { FeedItem, PartyQuote } from "./types";

const NAME_TICKERS: { test: RegExp; symbol: string }[] = [
  { test: /\bnvent\b/i, symbol: "NVT" },
  { test: /\bdescartes\b/i, symbol: "DSGX" },
  { test: /\bafya\b/i, symbol: "AFYA" },
  { test: /\byduqs\b/i, symbol: "YDUQ3.SA" },
  { test: /\bpetrobras\b/i, symbol: "PETR4.SA" },
  { test: /\bvale\b/i, symbol: "VALE3.SA" },
  { test: /\bbraskem\b/i, symbol: "BRKM5.SA" },
  { test: /\bibovespa\b/i, symbol: "^BVSP" },
  { test: /\bdesktop\b/i, symbol: "DESK3.SA" },
  { test: /\busiminas\b/i, symbol: "USIM5.SA" },
  { test: /\bhapvida\b/i, symbol: "HAPV3.SA" },
];

function unique(symbols: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of symbols) {
    const key = s.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function toYahooSymbol(raw: string, exchangeHint?: string): string {
  const s = raw.toUpperCase().replace(/\s+/g, "");
  if (s === "IBOV" || s === "IBOVESPA" || s === "^BVSP") return "^BVSP";
  if (s.endsWith(".SA")) return s;
  if (exchangeHint === "B3" || /^[A-Z]{4}\d$/.test(s)) return `${s}.SA`;
  return s;
}

export function extractSymbols(name: string, extra?: string | null): string[] {
  const found: string[] = [];

  const listed = name.matchAll(
    /\b(NYSE|Nasdaq|NASDAQ|NYSE American|NYSE Arca|B3|Bovespa)\s*:\s*([A-Z0-9.^]+)/gi,
  );
  for (const m of listed) {
    const hint = /b3|bovespa/i.test(m[1]) ? "B3" : undefined;
    found.push(toYahooSymbol(m[2], hint));
  }

  for (const m of name.matchAll(/\(([A-Z]{1,6}(?:\.[A-Z]{1,3})?)\)/g)) {
    if (/^(NYSE|NASDAQ|B3)$/i.test(m[1])) continue;
    found.push(toYahooSymbol(m[1]));
  }

  for (const rule of NAME_TICKERS) {
    if (rule.test.test(name)) found.push(rule.symbol);
  }

  if (extra?.trim()) found.push(toYahooSymbol(extra.trim()));
  return unique(found);
}

export type YahooSnapshot = {
  ticker: string;
  price: number | null;
  changePct: number | null;
  currency: string | null;
};

export async function fetchYahooQuote(symbol: string): Promise<YahooSnapshot> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const empty: YahooSnapshot = { ticker: symbol, price: null, changePct: null, currency: null };
  const res = await fetch(url, {
    next: { revalidate: 120 },
    headers: {
      "User-Agent": "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return empty;

  const data = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: { regularMarketPrice?: number; currency?: string };
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };
  const row = data.chart?.result?.[0];
  const price = row?.meta?.regularMarketPrice ?? null;
  const currency = row?.meta?.currency ?? null;
  const closes = (row?.indicators?.quote?.[0]?.close || []).filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
  const prev = closes.length >= 2 ? closes[closes.length - 2] : null;
  const changePct =
    price != null && prev != null && prev !== 0 ? ((price - prev) / prev) * 100 : null;
  return { ticker: symbol, price, changePct, currency };
}

export async function loadQuotes(
  symbols: string[],
  limit = 16,
): Promise<Map<string, PartyQuote>> {
  const map = new Map<string, PartyQuote>();
  const uniq = unique(symbols).slice(0, limit);
  const rows: PartyQuote[] = [];
  const batchSize = 12;
  for (let i = 0; i < uniq.length; i += batchSize) {
    const batch = await Promise.all(
      uniq.slice(i, i + batchSize).map(async (symbol) => {
        try {
          const snap = await fetchYahooQuote(symbol);
          return { ticker: snap.ticker, changePct: snap.changePct };
        } catch {
          return { ticker: symbol, changePct: null };
        }
      }),
    );
    rows.push(...batch);
  }
  for (const row of rows) map.set(row.ticker, row);
  return map;
}

function hydrate(quotes: PartyQuote[] | undefined, book: Map<string, PartyQuote>): PartyQuote[] {
  if (!quotes?.length) return [];
  return quotes.map((q) => book.get(q.ticker) ?? q);
}

export async function attachQuotes(items: FeedItem[]): Promise<FeedItem[]> {
  const annotated = items.map((item) => {
    const acquirerQuotes =
      item.acquirerQuotes?.length
        ? item.acquirerQuotes
        : extractSymbols(item.acquirer).map((ticker) => ({ ticker, changePct: null }));
    const targetQuotes =
      item.targetQuotes?.length
        ? item.targetQuotes
        : extractSymbols(item.target).map((ticker) => ({ ticker, changePct: null }));
    return { ...item, acquirerQuotes, targetQuotes };
  });

  const symbols = annotated.flatMap((i) => [
    ...(i.acquirerQuotes || []).map((q) => q.ticker),
    ...(i.targetQuotes || []).map((q) => q.ticker),
  ]);
  const book = await loadQuotes(symbols);

  return annotated.map((item) => ({
    ...item,
    acquirerQuotes: hydrate(item.acquirerQuotes, book),
    targetQuotes: hydrate(item.targetQuotes, book),
  }));
}
