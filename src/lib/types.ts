export type FeedCategory = "brazil-ma" | "international-ma" | "brazil-news";
export type FeedKind = "deal" | "news";
export type Provenance = "live" | "estimated" | "needs-api" | "api";

export type PartyQuote = {
  ticker: string;
  changePct: number | null;
};

export type FeedItem = {
  id: string;
  category: FeedCategory;
  kind: FeedKind;
  acquirer: string;
  target: string;
  acquirerQuotes?: PartyQuote[];
  targetQuotes?: PartyQuote[];
  headline: string;
  sector: string;
  valueUsd: number | null;
  valueBrl: number | null;
  valueNote: string;
  highlights: string;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: string;
  provenance: Provenance;
  status: string;
};

export type FeedStats = {
  brazilLive: number;
  internationalLive: number;
  newsCount: number;
  disclosedUsd: number;
  undisclosedLive: number;
  lastUpdatedIso: string;
  fx: number;
  apiConnected: boolean;
  apiSource: string;
};

export type FeedResponse = {
  items: FeedItem[];
  stats: FeedStats;
};
