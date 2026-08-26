import type { FeedItem } from "./types";

const WINDOW_MS = 168 * 3_600_000;
const MAX_ITEMS = 12;
const UA = "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)";

const FEEDS = [
  { name: "g1", url: "https://g1.globo.com/rss/g1/economia/" },
  { name: "InfoMoney", url: "https://www.infomoney.com.br/feed/" },
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=Ibovespa+OR+Braskem+OR+Yduqs+OR+fus%C3%A3o+OR+aquisi%C3%A7%C3%A3o+OR+Desktop+when:2d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  },
];

const KEEP =
  /ibovespa|petrobras|braskem|yduqs|afya|fus[aã]o|aquisi|combina[cç][aã]o de neg[oó]cios|\bopa\b|\bipo\b|recupera[cç][aã]o extrajudicial|recupera[cç][aã]o judicial|fal[eê]ncia da oi|fato relevante|usiminas|ternium|\bfocus\b|selic|jbs|batista|avibras|elfa|p[áa]tria|fechamento de capital|desktop|fasternet|hapvida|magazine luiza/i;

const SKIP =
  /loteria|mega-sena|hor[oó]scopo|finan[cç]as pessoais|#\d+|o assunto|podcast|v[ií]deo:|como fazer|imposto de renda 20|conhe[cç]a a braskem|caminho da braskem|mineração da braskem|ped[aá]gio|free flow|\bmei\b|contrata\+|tiktok|discord|picape|desenrola|dinheiro esquecido|\btcu\b|anpd|iphone|byd |paramount|warner|ruffalo|groenl[aâ]ndia|groenland|investing\.com|advocacia|escrit[oó]rios|uberl[aâ]ndia/i;

const FRESH_ANGLE =
  /ibovespa|sai do [ií]ndice|deix[ae] o|despenca|fecha em|recua \d|sobe \d|cai \d/;

const DEAL =
  /anuncia aquisi|compra .+ por|adquire|adquiriu|vende .+ control|confirma .{0,50}combina|fecha (?:a )?compra|fecha (?:a )?venda/i;

const CLUSTERS: { key: string; test: RegExp }[] = [
  { key: "ibovespa", test: /ibovespa/i },
  { key: "braskem", test: /braskem/i },
  { key: "yduqs", test: /yduqs|afya/i },
  { key: "avibras", test: /avibras|batista/i },
  { key: "elfa", test: /\belfa\b|p[áa]tria/i },
  { key: "focus", test: /\bfocus\b|selic|ipca/i },
  { key: "oi", test: /\boi\b/i },
  { key: "desktop", test: /desktop|fasternet/i },
];

const SOURCE_RANK: Record<string, number> = {
  "Valor Econômico": 10,
  InfoMoney: 9,
  g1: 8,
  Exame: 7,
  "O GLOBO": 6,
  "Folha de S.Paulo": 5,
  Estadão: 5,
  "Bloomberg Línea": 5,
};

type RssItem = {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
  sourceName: string;
};

function decode(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

function toIso(pubDate: string): string | null {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function splitTitle(title: string): { headline: string; source?: string } {
  const parts = title.split(" - ");
  if (parts.length < 2) return { headline: title };
  const source = parts[parts.length - 1].trim();
  if (source.length < 3 || source.length > 40) return { headline: title };
  return { headline: parts.slice(0, -1).join(" - ").trim(), source };
}

function clusterKey(title: string, day: string): string {
  const hit = CLUSTERS.find((c) => c.test.test(title));
  if (hit) return `${hit.key}|${day}`;
  return `${slug(title).slice(0, 32)}|${day}`;
}

function parseRss(xml: string, fallbackSource: string): RssItem[] {
  const items: RssItem[] = [];
  for (const chunk of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = chunk[1];
    const rawTitle = tag(block, "title");
    const split = splitTitle(rawTitle);
    const publishedAt = toIso(tag(block, "pubDate") || tag(block, "updated"));
    const link = tag(block, "link") || tag(block, "guid");
    if (!rawTitle || !publishedAt || !link) continue;
    if (Date.now() - new Date(publishedAt).getTime() > WINDOW_MS) continue;
    if (!KEEP.test(split.headline) || SKIP.test(split.headline)) continue;
    items.push({
      title: split.headline,
      link,
      publishedAt,
      summary: decode(tag(block, "description")).slice(0, 280),
      sourceName: split.source || tag(block, "source") || fallbackSource,
    });
  }
  return items;
}

function partyFromTitle(title: string): { acquirer: string; target: string } {
  const deal = title.match(
    /^(.{2,60}?)\s+(?:compra|adquire|adquiriu|anuncia aquisi[cç][aã]o da|fusiona(?:-se)? com|negocia fus[aã]o com)\s+(.{2,60}?)(?:\s+por\b.*)?$/i,
  );
  if (deal) {
    return { acquirer: deal[1].trim(), target: deal[2].trim() };
  }
  const names = title.match(
    /\b(Ibovespa|Petrobras|Vale|Braskem|Yduqs|Afya|Desktop|Usiminas|Oi|Hapvida|Magazine Luiza|Casas Bahia|Embraer)\b/gi,
  );
  const uniq = Array.from(new Set((names || []).map((n) => n)));
  if (uniq.length >= 2) return { acquirer: uniq[0], target: uniq.slice(1).join(" / ") };
  if (uniq.length === 1) return { acquirer: uniq[0], target: title };
  return { acquirer: "Brazil tape", target: title };
}

function toItem(row: RssItem): FeedItem {
  const deal = DEAL.test(row.title);
  const parties = partyFromTitle(row.title);
  return {
    id: `news-live-${slug(row.title)}-${row.publishedAt.slice(0, 10)}`,
    category: deal ? "brazil-ma" : "brazil-news",
    kind: deal ? "deal" : "news",
    acquirer: parties.acquirer,
    target: parties.target,
    headline: row.title,
    sector: deal ? "M&A / Brazil" : "Markets",
    valueUsd: null,
    valueBrl: null,
    valueNote: deal
      ? "Consideration as reported in the press headline — confirm against the filing."
      : "Not a deal — live session / corporate tape.",
    highlights: row.summary || row.title,
    sourceName: row.sourceName,
    sourceUrl: row.link,
    publishedAt: row.publishedAt,
    provenance: "live",
    status: deal ? "Announced (press)" : "Corporate news",
  };
}

async function loadFeed(feed: (typeof FEEDS)[number]): Promise<RssItem[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: 600 },
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!res.ok) return [];
    return parseRss(await res.text(), feed.name);
  } catch {
    return [];
  }
}

function existingKeys(seed: FeedItem[]): { keys: Set<string>; named: Set<string> } {
  const keys = new Set<string>();
  const named = new Set<string>();
  for (const item of seed) {
    const blob = `${item.headline} ${item.acquirer} ${item.target}`;
    const day = item.publishedAt.slice(0, 10);
    keys.add(clusterKey(blob, day));
    if (item.sourceUrl) keys.add(item.sourceUrl);
    const namedHit = CLUSTERS.find((c) => c.test.test(blob));
    if (namedHit) named.add(namedHit.key);
  }
  return { keys, named };
}

export async function fetchLiveBrazilNews(seed: FeedItem[]): Promise<FeedItem[]> {
  const rows = (await Promise.all(FEEDS.map(loadFeed))).flat();
  const taken = existingKeys(seed);
  const ranked = rows.sort((a, b) => {
    const rank = (SOURCE_RANK[b.sourceName] || 0) - (SOURCE_RANK[a.sourceName] || 0);
    if (rank) return rank;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  const out: FeedItem[] = [];
  for (const row of ranked) {
    const day = row.publishedAt.slice(0, 10);
    const key = clusterKey(row.title, day);
    const namedHit = CLUSTERS.find((c) => c.test.test(row.title));
    if (taken.keys.has(key) || taken.keys.has(row.link)) continue;
    if (namedHit && taken.named.has(namedHit.key) && !FRESH_ANGLE.test(row.title)) continue;
    taken.keys.add(key);
    taken.keys.add(row.link);
    out.push(toItem(row));
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}
