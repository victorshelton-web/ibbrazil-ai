import { unzipNamed } from "./zip-csv";

const EQUITY = new Set(["Ações Ordinárias", "Ações Preferenciais", "Units"]);

const SUFFIX_RANK = [11, 4, 5, 6, 3, 7, 8, 9, 10, 1, 2];

const GENERIC = new Set([
  "acoes",
  "banco",
  "brasil",
  "brasileira",
  "brasileiro",
  "cia",
  "companhia",
  "energia",
  "grupo",
  "holding",
  "inc",
  "investimentos",
  "ltda",
  "participacoes",
  "s.a",
  "sa",
]);

const EXTRA_ALIASES: { needle: string; ticker: string }[] = [
  { needle: "american airlines", ticker: "AAL" },
  { needle: "azul", ticker: "AZUL4.SA" },
  { needle: "ambev", ticker: "ABEV3.SA" },
  { needle: "axia", ticker: "AXIA3.SA" },
  { needle: "banco do brasil", ticker: "BBAS3.SA" },
  { needle: "bradesco", ticker: "BBDC4.SA" },
  { needle: "braskem", ticker: "BRKM5.SA" },
  { needle: "btg", ticker: "BPAC11.SA" },
  { needle: "copasa", ticker: "CSMG3.SA" },
  { needle: "csn", ticker: "CSNA3.SA" },
  { needle: "embraer", ticker: "EMBR3.SA" },
  { needle: "equatorial", ticker: "EQTL3.SA" },
  { needle: "gerdau", ticker: "GGBR4.SA" },
  { needle: "itau unibanco", ticker: "ITUB4.SA" },
  { needle: "itau", ticker: "ITUB4.SA" },
  { needle: "jbs", ticker: "JBSS3.SA" },
  { needle: "localiza", ticker: "RENT3.SA" },
  { needle: "magazine luiza", ticker: "MGLU3.SA" },
  { needle: "magalu", ticker: "MGLU3.SA" },
  { needle: "marfrig", ticker: "MRFG3.SA" },
  { needle: "minerva", ticker: "BEEF3.SA" },
  { needle: "petrobras", ticker: "PETR4.SA" },
  { needle: "santander", ticker: "SANB11.SA" },
  { needle: "suzano", ticker: "SUZB3.SA" },
  { needle: "usiminas", ticker: "USIM5.SA" },
  { needle: "vale s.a", ticker: "VALE3.SA" },
  { needle: "weg", ticker: "WEGE3.SA" },
];

function fcaZipUrl(year: number): string {
  return `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FCA/DADOS/fca_cia_aberta_${year}.zip`;
}

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "").padStart(14, "0");
}

export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tickerRank(code: string): number {
  const m = code.match(/^[A-Z]{4}(\d{1,2})$/);
  if (!m) return 99;
  const idx = SUFFIX_RANK.indexOf(Number(m[1]));
  return idx === -1 ? 50 + Number(m[1]) : idx;
}

function pickPreferred(codes: string[]): string | null {
  const uniq = Array.from(new Set(codes.filter((c) => /^[A-Z]{4}\d{1,2}$/.test(c))));
  if (!uniq.length) return null;
  uniq.sort((a, b) => tickerRank(a) - tickerRank(b) || a.localeCompare(b));
  return uniq[0];
}

function aliasesFromName(name: string): string[] {
  const folded = foldText(name);
  const tokens = folded.split(" ").filter((t) => t.length >= 3 && !GENERIC.has(t) && t !== "s.a.");
  const out: string[] = [];
  if (tokens.length >= 2) {
    const joined = tokens.join(" ");
    if (joined.length >= 8) out.push(joined);
  }
  for (const token of tokens) {
    if (token.length >= 5) out.push(token);
  }
  return out;
}

function hasBound(hay: string, needle: string): boolean {
  const i = hay.indexOf(needle);
  if (i < 0) return false;
  const before = i === 0 ? " " : hay[i - 1];
  const after = i + needle.length >= hay.length ? " " : hay[i + needle.length];
  return /[^a-z0-9]/.test(before) && /[^a-z0-9]/.test(after);
}

type NamedCodes = { cnpj: string; name: string; codes: string[] };

function parseValorMobiliario(text: string): NamedCodes[] {
  const rows = text.split(/\r?\n/).filter(Boolean);
  const header = (rows[0] || "").split(";");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const byCnpj = new Map<string, NamedCodes>();

  for (const line of rows.slice(1)) {
    const row = line.split(";");
    const code = (row[idx.Codigo_Negociacao] || "").trim().toUpperCase();
    const ended = (row[idx.Data_Fim_Negociacao] || "").trim();
    const market = row[idx.Mercado] || "";
    const kind = row[idx.Valor_Mobiliario] || "";
    if (!code || ended || !EQUITY.has(kind) || !/bolsa/i.test(market)) continue;
    const cnpj = normalizeCnpj(row[idx.CNPJ_Companhia] || "");
    if (cnpj.length !== 14 || /^0+$/.test(cnpj)) continue;
    const current = byCnpj.get(cnpj) || {
      cnpj,
      name: row[idx.Nome_Empresarial] || "",
      codes: [],
    };
    current.codes.push(code);
    if (!current.name) current.name = row[idx.Nome_Empresarial] || "";
    byCnpj.set(cnpj, current);
  }
  return Array.from(byCnpj.values());
}

export type B3TickerBook = {
  byCnpj: Map<string, string>;
  match(text: string): string[];
};

function buildBook(rows: NamedCodes[]): B3TickerBook {
  const byCnpj = new Map<string, string>();
  const matchers: { needle: string; ticker: string }[] = [...EXTRA_ALIASES];

  for (const row of rows) {
    const ticker = pickPreferred(row.codes);
    if (!ticker) continue;
    const yahoo = `${ticker}.SA`;
    byCnpj.set(row.cnpj, yahoo);
    for (const alias of aliasesFromName(row.name)) {
      matchers.push({ needle: alias, ticker: yahoo });
    }
  }

  matchers.sort((a, b) => b.needle.length - a.needle.length || a.needle.localeCompare(b.needle));

  return {
    byCnpj,
    match(text: string) {
      const hay = ` ${foldText(text)} `;
      const found: string[] = [];
      const seen = new Set<string>();
      for (const { needle, ticker } of matchers) {
        if (seen.has(ticker) || !hasBound(hay, needle)) continue;
        seen.add(ticker);
        found.push(ticker);
      }
      const raw = text.toUpperCase();
      for (const m of raw.matchAll(/\b([A-Z]{4}(?:11|[3-6]))\b/g)) {
        const symbol = `${m[1]}.SA`;
        if (!seen.has(symbol)) {
          seen.add(symbol);
          found.push(symbol);
        }
      }
      return found;
    },
  };
}

async function loadYearRows(year: number): Promise<NamedCodes[]> {
  const res = await fetch(fcaZipUrl(year), {
    next: { revalidate: 86_400 },
    headers: { "User-Agent": "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)" },
  });
  if (!res.ok) return [];
  const buf = Buffer.from(await res.arrayBuffer());
  return parseValorMobiliario(unzipNamed(buf, (name) => /valor_mobiliario/i.test(name)));
}

export async function loadB3TickerBook(): Promise<B3TickerBook> {
  const year = new Date().getFullYear();
  try {
    let rows = await loadYearRows(year);
    if (rows.length < 50) {
      const prev = await loadYearRows(year - 1);
      const have = new Set(rows.map((r) => r.cnpj));
      rows = rows.concat(prev.filter((r) => !have.has(r.cnpj)));
    }
    return buildBook(rows);
  } catch {
    return buildBook([]);
  }
}

export async function loadB3TickerMap(): Promise<Map<string, string>> {
  return (await loadB3TickerBook()).byCnpj;
}
