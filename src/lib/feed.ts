import type { FeedItem } from "./types";
import seed from "@/data/seed-deals.json";

const FX = Number(process.env.FX_BRL_USD || "5.16");
const WINDOW_HOURS = Number(process.env.FEED_WINDOW_HOURS || "168");

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

const SMALL_WORDS = new Set([
  "A",
  "AN",
  "AND",
  "AS",
  "AT",
  "BY",
  "FOR",
  "FROM",
  "IN",
  "OF",
  "ON",
  "OR",
  "THE",
  "TO",
  "VIA",
  "WITH",
]);

const LEGAL_SUFFIX = new Set([
  "INC",
  "INC.",
  "CORP",
  "CORP.",
  "CO",
  "CO.",
  "LLC",
  "LTD",
  "LTD.",
  "PLC",
  "LP",
  "LLP",
  "SA",
  "S.A.",
  "NV",
  "AG",
  "GMBH",
  "BV",
  "AB",
]);

const BRAND_KEEP = new Set([
  "IBM",
  "UPS",
  "HP",
  "BMW",
  "UBS",
  "ING",
  "TD",
  "BTG",
  "XP",
  "AI",
  "GLP",
  "TMS",
  "ON",
  "USA",
  "UK",
  "US",
  "EU",
]);

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function titleCaseCompany(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((raw, idx) => {
      const clean = raw.replace(/,$/, "");
      const upper = clean.toUpperCase();
      const trailingComma = raw.endsWith(",") ? "," : "";

      if (LEGAL_SUFFIX.has(upper)) {
        const pretty =
          upper === "INC" || upper === "INC."
            ? "Inc."
            : upper === "CORP" || upper === "CORP."
              ? "Corp."
              : upper === "CO" || upper === "CO."
                ? "Co."
                : upper === "LTD" || upper === "LTD."
                  ? "Ltd."
                  : upper;
        return pretty + trailingComma;
      }
      if (BRAND_KEEP.has(upper)) return upper + trailingComma;
      if (SMALL_WORDS.has(upper) && idx > 0 && idx < parts.length - 1) {
        return upper.toLowerCase() + trailingComma;
      }
      if (/^[A-Z0-9.&/-]+$/.test(clean) && clean.length <= 4 && /[0-9]/.test(clean)) {
        return clean + trailingComma;
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() + trailingComma;
    })
    .join(" ");
}

function toIso(acceptedDate?: string, transactionDate?: string): string {
  if (acceptedDate) {
    const normalized = acceptedDate.includes("T")
      ? acceptedDate
      : `${acceptedDate.replace(" ", "T")}Z`;
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (transactionDate) {
    const d = new Date(`${transactionDate}T16:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function withinWindow(iso: string): boolean {
  const ageMs = Date.now() - new Date(iso).getTime();
  return ageMs <= WINDOW_HOURS * 3_600_000;
}

function mapFmpRow(row: FmpMaRow): FeedItem | null {
  const acquirerRaw = row.companyName?.trim();
  const targetRaw = row.targetedCompanyName?.trim();
  if (!acquirerRaw || !targetRaw) return null;

  const acquirer = titleCaseCompany(acquirerRaw);
  const target = titleCaseCompany(targetRaw);
  const acqTicker = row.symbol ? ` (${row.symbol})` : "";
  const tgtTicker = row.targetedSymbol ? ` (${row.targetedSymbol})` : "";
  const publishedAt = toIso(row.acceptedDate, row.transactionDate);

  return {
    id: `int-fmp-${slug(row.cik || row.symbol || acquirer)}-${slug(row.targetedCik || row.targetedSymbol || target)}-${row.transactionDate || "na"}`,
    category: "international-ma",
    kind: "deal",
    acquirer: `${acquirer}${acqTicker}`,
    target: `${target}${tgtTicker}`,
    headline: `${acquirer} files for combination with ${target}`,
    sector: "Multi-sector",
    valueUsd: null,
    valueBrl: null,
    valueNote: "Consideration not disclosed in the FMP summary — confirm in the SEC filing.",
    highlights: `SEC M&A disclosure ingested via Financial Modeling Prep. Transaction date ${row.transactionDate || "n/a"}; filing accepted ${row.acceptedDate || "n/a"}. Terms, consideration and closing conditions should be verified against the linked EDGAR document.`,
    sourceName: "FMP / SEC EDGAR",
    sourceUrl: row.link || null,
    publishedAt,
    provenance: "api",
    status: "Announced (SEC filing)",
  };
}

async function fetchFmpInternational(): Promise<{
  items: FeedItem[];
  connected: boolean;
  error?: string;
}> {
  const key = process.env.FMP_API_KEY?.trim();
  if (!key) {
    return { items: [], connected: false, error: "missing_key" };
  }

  const url = `https://financialmodelingprep.com/stable/mergers-acquisitions-latest?page=0&limit=5&apikey=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)" },
    });
    if (!res.ok) {
      return { items: [], connected: false, error: `http_${res.status}` };
    }
    const data = (await res.json()) as FmpMaRow[] | { Error?: string };
    if (!Array.isArray(data)) {
      return { items: [], connected: false, error: "bad_payload" };
    }

    const items: FeedItem[] = [];
    const seen = new Set<string>();
    for (const row of data) {
      const item = mapFmpRow(row);
      if (!item) continue;
      const dedupeKey = [
        (row.companyName || "").toLowerCase().replace(/\s+/g, " ").trim(),
        (row.targetedCompanyName || "").toLowerCase().replace(/\s+/g, " ").trim(),
        row.transactionDate || item.publishedAt.slice(0, 10),
      ].join("|");
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push(item);
    }
    return { items, connected: true };
  } catch {
    return { items: [], connected: false, error: "network" };
  }
}

function isPlaceholderRow(item: FeedItem): boolean {
  const blob = `${item.id} ${item.acquirer} ${item.target} ${item.headline}`;
  return (
    item.id === "br-placeholder-midmarket" ||
    item.provenance === "needs-api" ||
    item.provenance === "estimated" ||
    /\[NOT A FILING\]/i.test(blob) ||
    /placeholder/i.test(blob)
  );
}

function curatedSeed(): FeedItem[] {
  return (seed as FeedItem[])
    .filter((item) => !isPlaceholderRow(item))
    .map((item) => ({ ...item }));
}

function normParty(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function buildFeed() {
  const curated = curatedSeed();
  const fmp = await fetchFmpInternational();

  const byId = new Map<string, FeedItem>();
  for (const item of curated) byId.set(item.id, item);

  const curatedIntlKeys = new Set(
    curated
      .filter((i) => i.category === "international-ma")
      .map((i) => `${normParty(i.acquirer)}|${normParty(i.target)}`),
  );

  for (const item of fmp.items) {
    const key = `${normParty(item.acquirer)}|${normParty(item.target)}`;
    if (curatedIntlKeys.has(key)) continue;
    byId.set(item.id, item);
  }

  // Operator-facing offline marker only — no env var names in public copy
  if (!fmp.connected) {
    byId.set("int-api-offline", {
      id: "int-api-offline",
      category: "international-ma",
      kind: "deal",
      acquirer: "Global M&A tape",
      target: "Late-session North America / Asia prints",
      headline: "International feed temporarily offline — curated global rows only",
      sector: "Multi-sector",
      valueUsd: null,
      valueBrl: null,
      valueNote: "No value — live international ingest unavailable.",
      highlights:
        "The live SEC/FMP international tape could not be refreshed for this window. Curated international announcements remain visible. This row is not a transaction.",
      sourceName: "ibbrazil.ai",
      sourceUrl: null,
      publishedAt: new Date().toISOString(),
      provenance: "needs-api",
      status: "Feed offline",
    });
  }

  const items = Array.from(byId.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const liveDeal = (i: FeedItem) =>
    i.kind === "deal" && (i.provenance === "live" || i.provenance === "api");

  const inWindowLive = (i: FeedItem) => liveDeal(i) && withinWindow(i.publishedAt);

  const brazilLive = items.filter((i) => i.category === "brazil-ma" && inWindowLive(i)).length;
  const internationalLive = items.filter(
    (i) => i.category === "international-ma" && inWindowLive(i),
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
      apiSource: fmp.connected ? "FMP / SEC EDGAR" : "offline",
    },
  };
}
