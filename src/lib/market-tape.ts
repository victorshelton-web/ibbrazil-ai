import { fetchYahooQuote, type YahooSnapshot } from "./quotes";

export type TapeMarket = "b3" | "nasdaq";

export type TapeQuote = {
  ticker: string;
  label: string;
  price: number | null;
  changePct: number | null;
  currency: string | null;
};

export type MarketTape = {
  b3: TapeQuote[];
  nasdaq: TapeQuote[];
};

const B3: { symbol: string; label: string }[] = [
  { symbol: "^BVSP", label: "IBOV" },
  { symbol: "PETR4.SA", label: "PETR4" },
  { symbol: "VALE3.SA", label: "VALE3" },
  { symbol: "ITUB4.SA", label: "ITUB4" },
  { symbol: "BBDC4.SA", label: "BBDC4" },
  { symbol: "BBAS3.SA", label: "BBAS3" },
  { symbol: "B3SA3.SA", label: "B3SA3" },
  { symbol: "WEGE3.SA", label: "WEGE3" },
  { symbol: "ABEV3.SA", label: "ABEV3" },
  { symbol: "PRIO3.SA", label: "PRIO3" },
  { symbol: "SUZB3.SA", label: "SUZB3" },
  { symbol: "RENT3.SA", label: "RENT3" },
];

const NASDAQ: { symbol: string; label: string }[] = [
  { symbol: "^IXIC", label: "COMP" },
  { symbol: "AAPL", label: "AAPL" },
  { symbol: "MSFT", label: "MSFT" },
  { symbol: "NVDA", label: "NVDA" },
  { symbol: "AMZN", label: "AMZN" },
  { symbol: "GOOGL", label: "GOOGL" },
  { symbol: "META", label: "META" },
  { symbol: "TSLA", label: "TSLA" },
  { symbol: "AVGO", label: "AVGO" },
  { symbol: "NFLX", label: "NFLX" },
  { symbol: "AMD", label: "AMD" },
  { symbol: "COST", label: "COST" },
];

function toTapeQuote(
  spec: { symbol: string; label: string },
  snap: YahooSnapshot,
): TapeQuote {
  return {
    ticker: spec.symbol,
    label: spec.label,
    price: snap.price,
    changePct: snap.changePct,
    currency: snap.currency,
  };
}

async function loadSide(list: { symbol: string; label: string }[]): Promise<TapeQuote[]> {
  const rows = await Promise.all(
    list.map(async (spec) => {
      try {
        return toTapeQuote(spec, await fetchYahooQuote(spec.symbol));
      } catch {
        return toTapeQuote(spec, {
          ticker: spec.symbol,
          price: null,
          changePct: null,
          currency: null,
        });
      }
    }),
  );
  return rows;
}

export async function loadMarketTape(): Promise<MarketTape> {
  const [b3, nasdaq] = await Promise.all([loadSide(B3), loadSide(NASDAQ)]);
  return { b3, nasdaq };
}
