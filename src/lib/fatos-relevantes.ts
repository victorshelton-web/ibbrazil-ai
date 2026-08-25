import { loadB3TickerBook, normalizeCnpj } from "./b3-tickers";
import { loadQuotes } from "./quotes";
import type { PartyQuote } from "./types";
import { unzipFirst } from "./zip-csv";

export type FatoGroup =
  | "ma"
  | "dividend"
  | "offer"
  | "buyback"
  | "reorg"
  | "gov"
  | "earnings"
  | "clarify"
  | "other";

export type FatoRelevante = {
  id: string;
  company: string;
  cnpj: string;
  subject: string;
  deliveredAt: string;
  group: FatoGroup;
  url: string | null;
  quotes: PartyQuote[];
};

export type FatosFeed = {
  items: FatoRelevante[];
  windowDays: number;
  asOf: string;
  companyCount: number;
  counts: Record<FatoGroup | "all", number>;
};

const WINDOW_DAYS = 21;

function ipeZipUrl(year: number): string {
  return `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_${year}.zip`;
}

function classify(subject: string): FatoGroup {
  const s = subject.toLowerCase();
  if (
    /aquisi|aliena|desinvest|controle|combina|cis[aã]o|incorpora|fus[aã]o|joint\s*venture|venda de|compra e venda|compra de|participa|propostas? vinculantes|cess[aã]o|mou|m\.o\.u/.test(
      s,
    )
  ) {
    return "ma";
  }
  if (/dividend|jcp|juros sobre capital|provento|remunera/.test(s)) return "dividend";
  if (/recompra|tesouraria/.test(s)) return "buyback";
  if (
    /oferta|follow[- ]?on|ipo|\bopa\b|distribui[cç][aã]o p[uú]blica|aumento de capital|grupamento|cancelamento de a[cç][oõ]es/.test(
      s,
    )
  ) {
    return "offer";
  }
  if (/recupera|fal[eê]ncia|reestrutur|renegocia|\bprj\b/.test(s)) return "reorg";
  if (/elei[cç]|ren[uú]ncia|conselho|assembleia|diretor|administra/.test(s)) return "gov";
  if (/itr|dfp|resultado|guidance|proje[cç]|demonstra[cç][oõ]es financeiras/.test(s)) {
    return "earnings";
  }
  if (/esclarec|not[ií]cia|rumor|mat[eé]ria/.test(s)) return "clarify";
  return "other";
}

function titleCompany(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => {
      const upper = part.toUpperCase();
      if (["S.A.", "S.A", "SA", "S/A"].includes(upper)) return "S.A.";
      if (["E", "DE", "DA", "DO", "DOS", "DAS"].includes(upper)) return upper.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function unzipCsv(buf: Buffer): string {
  return unzipFirst(buf);
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(";"));
}

function emptyFeed(): FatosFeed {
  return {
    items: [],
    windowDays: WINDOW_DAYS,
    asOf: new Date().toISOString(),
    companyCount: 0,
    counts: {
      all: 0,
      ma: 0,
      dividend: 0,
      offer: 0,
      buyback: 0,
      reorg: 0,
      gov: 0,
      earnings: 0,
      clarify: 0,
      other: 0,
    },
  };
}

function collectCategory(
  rows: string[][],
  idx: Record<string, number>,
  category: string,
): FatoRelevante[] {
  const cut = Date.now() - WINDOW_DAYS * 86_400_000;
  const seen = new Set<string>();
  const items: FatoRelevante[] = [];

  for (const row of rows.slice(1)) {
    if ((row[idx.Categoria] || "") !== category) continue;
    const delivered = (row[idx.Data_Entrega] || "").slice(0, 10);
    const t = new Date(`${delivered}T15:00:00-03:00`).getTime();
    if (!delivered || Number.isNaN(t) || t < cut) continue;
    const company = titleCompany(row[idx.Nome_Companhia] || "");
    const subject = (row[idx.Assunto] || "").trim();
    if (!company || !subject) continue;
    const key = `${company}|${subject}|${delivered}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: row[idx.Protocolo_Entrega] || key,
      company,
      cnpj: row[idx.CNPJ_Companhia] || "",
      subject,
      deliveredAt: delivered,
      group: classify(subject),
      url: row[idx.Link_Download] || null,
      quotes: [],
    });
  }

  items.sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt) || a.company.localeCompare(b.company));
  return items;
}

function toFeed(items: FatoRelevante[]): FatosFeed {
  const counts: FatosFeed["counts"] = {
    all: items.length,
    ma: 0,
    dividend: 0,
    offer: 0,
    buyback: 0,
    reorg: 0,
    gov: 0,
    earnings: 0,
    clarify: 0,
    other: 0,
  };
  for (const item of items) counts[item.group] += 1;
  return {
    items,
    windowDays: WINDOW_DAYS,
    asOf: new Date().toISOString(),
    companyCount: new Set(items.map((item) => item.company)).size,
    counts,
  };
}

export async function loadCvmIpeDesk(): Promise<{
  fatos: FatosFeed;
  comunicados: FatosFeed;
}> {
  const empty = { fatos: emptyFeed(), comunicados: emptyFeed() };

  try {
    const year = new Date().getFullYear();
    const headers = { "User-Agent": "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)" };
    let res = await fetch(ipeZipUrl(year), {
      next: { revalidate: 3600 },
      headers,
    });
    if (!res.ok) {
      res = await fetch(ipeZipUrl(year - 1), {
        next: { revalidate: 3600 },
        headers,
      });
    }
    if (!res.ok) return empty;
    const buf = Buffer.from(await res.arrayBuffer());
    const rows = parseCsv(unzipCsv(buf));
    const header = rows[0] || [];
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));

    const fatoItems = collectCategory(rows, idx, "Fato Relevante");
    const comunicadoItems = collectCategory(rows, idx, "Comunicado ao Mercado");
    const all = [...fatoItems, ...comunicadoItems];

    const tickerBook = await loadB3TickerBook();
    const symbols = Array.from(
      new Set(
        all.flatMap((item) => {
          const byCnpj = tickerBook.byCnpj.get(normalizeCnpj(item.cnpj));
          const byName = tickerBook.match(`${item.company} ${item.subject}`);
          return byCnpj ? [byCnpj, ...byName] : byName;
        }),
      ),
    );
    const quotes = await loadQuotes(symbols, 220);
    for (const item of all) {
      const byCnpj = tickerBook.byCnpj.get(normalizeCnpj(item.cnpj));
      const found = Array.from(
        new Set([
          ...(byCnpj ? [byCnpj] : []),
          ...tickerBook.match(`${item.company} ${item.subject}`),
        ]),
      );
      item.quotes = found.map((ticker) => quotes.get(ticker) ?? { ticker, changePct: null });
    }

    return {
      fatos: toFeed(fatoItems),
      comunicados: toFeed(comunicadoItems),
    };
  } catch {
    return empty;
  }
}

export async function loadFatosRelevantes(): Promise<FatosFeed> {
  return (await loadCvmIpeDesk()).fatos;
}
