import type { FeedItem } from "./types";
import seed from "@/data/seed-deals.json";

const FX = Number(process.env.FX_BRL_USD || "5.16");

type FmpMaRow = {
  symbol?: string;
  companyName?: string;
  cik?: string;
  targetedCompanyName?: string;
  targetedCik?: string;
  targetedSymbol?: string;
  transactionDate?: string;
  acceptedDate?: string;
  link?: string;
};

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function titleCaseCompany(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => {
      const upper = w.toUpperCase();
      if (["INC", "INC.", "CORP", "CORP.", "LLC", "LTD", "LTD.", "PLC", "SA", "NV"].includes(upper)) {
        return upper.replace(/\.$/, ".");
      }
      if (w.length <= 3 && upper === w) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function toIso(acceptedDate?: string, transactionDate?: string): string {
  if (acceptedDate) {
    const normalized = acceptedDate.includes("T")
      ? acceptedDate
      : acceptedDate.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (transactionDate) {
    const d = new Date(`${transactionDate}T16:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function mapFmpRow(row: FmpMaRow): FeedItem | null {
  const acquirerRaw = row.companyName?.trim();
  const targetRaw = row.targetedCompanyName?.trim();
  if (!acquirerRaw || !targetRaw) return null;

  const acquirer = titleCaseCompany(acquirerRaw);
  const target = titleCaseCompany(targetRaw);
  const acqTicker = row.symbol ? ` (${row.symbol})` : "";
  const tgtTicker = row.targetedSymbol ? ` (${row.targetedSymbol})` : "";

  return {
    id: `int-fmp-${slug(row.symbol || acquirer)}-${slug(row.targetedSymbol || target)}-${row.transactionDate || "na"}`,
    category: "international-ma",
    kind: "deal",
    acquirer: `${acquirer}${acqTicker}`,
    target: `${target}${tgtTicker}`,
    headline: `${acquirer} acquires / combines with ${target}`,
    sector: "Multi-sector",
    valueUsd: null,
    valueBrl: null,
    valueNote: "Undisclosed in FMP tape — open SEC link for consideration.",
    highlights: `SEC-derived M&A print via Financial Modeling Prep. Transaction date ${row.transactionDate || "n/a"}; accepted ${row.acceptedDate || "n/a"}. Confirm terms against the filing.`,
    sourceName: "Financial Modeling Prep / SEC EDGAR",
    sourceUrl: row.link || null,
    publishedAt: toIso(row.acceptedDate, row.transactionDate),
    provenance: "api",
    status: "Announced (SEC filing)",
  };
}

async function fetchFmpInternational(): Promise<{ items: FeedItem[]; connected: boolean; error?: string }> {
  const key = process.env.FMP_API_KEY?.trim();
  if (!key) {
    return { items: [], connected: false, error: "FMP_API_KEY missing" };
  }

  // Free tier: limit must be 0–5
  const url = `https://financialmodelingprep.com/stable/mergers-acquisitions-latest?page=0&limit=5&apikey=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "ibbrazil.ai-terminal/1.0" },
    });
    if (!res.ok) {
      const body = await res.text();
      return { items: [], connected: false, error: `FMP HTTP ${res.status}: ${body.slice(0, 180)}` };
    }
    const data = (await res.json()) as FmpMaRow[] | { Error?: string };
    if (!Array.isArray(data)) {
      return { items: [], connected: false, error: JSON.stringify(data).slice(0, 180) };
    }
    const items: FeedItem[] = [];
    const seen = new Set<string>();
    for (const row of data) {
      const item = mapFmpRow(row);
      if (!item) continue;
      const key = [
        (row.companyName || "").toLowerCase().replace(/\s+/g, " ").trim(),
        (row.targetedCompanyName || "").toLowerCase().replace(/\s+/g, " ").trim(),
        row.transactionDate || item.publishedAt.slice(0, 10),
      ].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
    return { items, connected: true };
  } catch (err) {
    return {
      items: [],
      connected: false,
      error: err instanceof Error ? err.message : "FMP fetch failed",
    };
  }
}

function curatedSeed(): FeedItem[] {
  return (seed as FeedItem[])
    .filter((item) => item.provenance !== "needs-api")
    .filter((item) => item.id !== "br-placeholder-midmarket")
    .map((item) => ({ ...item }));
}

export async function buildFeed() {
  const curated = curatedSeed();
  const fmp = await fetchFmpInternational();

  const byId = new Map<string, FeedItem>();
  for (const item of curated) byId.set(item.id, item);
  for (const item of fmp.items) byId.set(item.id, item);

  // If API failed, keep an explicit needs-api marker so the UI stays honest
  if (!fmp.connected) {
    byId.set("int-api-refinitiv", {
      id: "int-api-refinitiv",
      category: "international-ma",
      kind: "deal",
      acquirer: "FMP / SEC tape",
      target: "Additional global announcements",
      headline: "Requires API key — set FMP_API_KEY to ingest live global M&A",
      sector: "Multi-sector",
      valueUsd: null,
      valueBrl: null,
      valueNote: "No value — feed not connected.",
      highlights: fmp.error
        ? `Feed error: ${fmp.error}`
        : "Add FMP_API_KEY in .env.local (free tier works with limit≤5).",
      sourceName: "API not connected",
      sourceUrl: "https://site.financialmodelingprep.com/developer/docs/stable/latest-mergers-acquisitions",
      publishedAt: new Date().toISOString(),
      provenance: "needs-api",
      status: "Feed not connected",
    });
  }

  const items = Array.from(byId.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const liveDeal = (i: FeedItem) =>
    i.kind === "deal" && (i.provenance === "live" || i.provenance === "api");

  const brazilLive = items.filter((i) => i.category === "brazil-ma" && liveDeal(i)).length;
  const internationalLive = items.filter(
    (i) => i.category === "international-ma" && liveDeal(i),
  ).length;
  const newsCount = items.filter((i) => i.category === "brazil-news").length;
  const disclosedUsd = items
    .filter(liveDeal)
    .reduce((sum, i) => sum + (typeof i.valueUsd === "number" ? i.valueUsd : 0), 0);
  const undisclosedLive = items.filter(liveDeal).filter((i) => i.valueUsd == null).length;

  return {
    items,
    stats: {
      brazilLive,
      internationalLive,
      newsCount,
      disclosedUsd,
      undisclosedLive,
      lastUpdatedIso: new Date().toISOString(),
      fx: FX,
      apiConnected: fmp.connected,
      apiSource: fmp.connected ? "Financial Modeling Prep (SEC M&A)" : "disconnected",
    },
  };
}
