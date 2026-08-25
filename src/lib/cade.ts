export type CadeGroup = "approved" | "restricted" | "agenda" | "review" | "other";

export type CadeItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  group: CadeGroup;
  kicker: string;
  url: string;
};

export type CadeFeed = {
  items: CadeItem[];
  windowDays: number;
  asOf: string;
  counts: Record<CadeGroup | "all", number>;
};

const WINDOW_DAYS = 90;
const LISTING = "https://www.gov.br/cade/pt-br/assuntos/noticias";
const PAGE_SIZE = 30;
const MAX_PAGES = 5;

const SKIP =
  /est[aá]gio|vaga de|servidor|carreira|artigo cient|wicade|eleitoral|consultor|requisita|processo seletivo|oportunidade aberta/;

const KEEP =
  /aprova|aquisi|concentra|fus[aã]o|sem restri|com restri|sg\/cade|opera[cç][aã]o|compra|investimento da|pauta da|sess[aã]o de julgamento|ato de concentra/;

function emptyFeed(): CadeFeed {
  return {
    items: [],
    windowDays: WINDOW_DAYS,
    asOf: new Date().toISOString(),
    counts: { all: 0, approved: 0, restricted: 0, agenda: 0, review: 0, other: 0 },
  };
}

function classify(title: string): CadeGroup {
  const s = title.toLowerCase();
  if (/pauta|sess[aã]o de julgamento/.test(s)) return "agenda";
  if (/com restri|rem[eé]dio|acordo em controle/.test(s)) return "restricted";
  if (/aprova|sem restri/.test(s)) return "approved";
  if (/parecer|analisa|recomenda|investiga|instaura/.test(s)) return "review";
  return "other";
}

function parseBrDate(value: string): string | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseListing(html: string): CadeItem[] {
  const blocks = html.split('<div class="conteudo">').slice(1);
  const items: CadeItem[] = [];

  for (const block of blocks) {
    const href = block.match(/<h2 class="titulo">\s*<a href="([^"]+)">([^<]+)<\/a>/);
    if (!href) continue;
    const title = decode(href[2]);
    const hay = title.toLowerCase();
    if (SKIP.test(hay) || !KEEP.test(hay)) continue;
    const dateRaw = block.match(/class="data">\s*(\d{2}\/\d{2}\/\d{4})/);
    const publishedAt = dateRaw ? parseBrDate(dateRaw[1]) : null;
    if (!publishedAt) continue;
    const kickerMatch =
      block.match(/class="subtitulo-noticia">([^<]+)/) ||
      block.match(/class="categoria-noticia">([^<]+)/);
    const descMatch = block.match(/class="descricao"[^>]*>[\s\S]*?<\/span>\s*<span>\s*-\s*<\/span>\s*([^<]+)/);
    items.push({
      id: href[1],
      title,
      summary: descMatch ? decode(descMatch[1]) : "",
      publishedAt,
      group: classify(title),
      kicker: kickerMatch ? decode(kickerMatch[1]) : "CADE",
      url: href[1],
    });
  }
  return items;
}

export async function loadCadeFeed(): Promise<CadeFeed> {
  const empty = emptyFeed();
  try {
    const cut = Date.now() - WINDOW_DAYS * 86_400_000;
    const seen = new Set<string>();
    const items: CadeItem[] = [];

    const pages = await Promise.all(
      Array.from({ length: MAX_PAGES }, async (_, page) => {
        const url = page === 0 ? LISTING : `${LISTING}?b_start:int=${page * PAGE_SIZE}`;
        const res = await fetch(url, {
          next: { revalidate: 3600 },
          headers: {
            "User-Agent": "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)",
            Accept: "text/html",
          },
        });
        if (!res.ok) return [];
        return parseListing(await res.text());
      }),
    );
    for (const item of pages.flat()) {
      const t = new Date(`${item.publishedAt}T15:00:00-03:00`).getTime();
      if (Number.isNaN(t) || t < cut || seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
    }

    items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
    const counts: CadeFeed["counts"] = {
      all: items.length,
      approved: 0,
      restricted: 0,
      agenda: 0,
      review: 0,
      other: 0,
    };
    for (const item of items) counts[item.group] += 1;
    return { items, windowDays: WINDOW_DAYS, asOf: new Date().toISOString(), counts };
  } catch {
    return empty;
  }
}
