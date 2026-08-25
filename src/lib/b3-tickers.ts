import { unzipNamed } from "./zip-csv";

const EQUITY = new Set(["Ações Ordinárias", "Ações Preferenciais", "Units"]);

const SUFFIX_RANK = [11, 4, 5, 6, 3, 7, 8, 9, 10, 1, 2];

function fcaZipUrl(year: number): string {
  return `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FCA/DADOS/fca_cia_aberta_${year}.zip`;
}

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "").padStart(14, "0");
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

function parseValorMobiliario(text: string): Map<string, string[]> {
  const rows = text.split(/\r?\n/).filter(Boolean);
  const header = (rows[0] || "").split(";");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const byCnpj = new Map<string, string[]>();

  for (const line of rows.slice(1)) {
    const row = line.split(";");
    const code = (row[idx.Codigo_Negociacao] || "").trim().toUpperCase();
    const ended = (row[idx.Data_Fim_Negociacao] || "").trim();
    const market = row[idx.Mercado] || "";
    const kind = row[idx.Valor_Mobiliario] || "";
    if (!code || ended || !EQUITY.has(kind) || !/bolsa/i.test(market)) continue;
    const cnpj = normalizeCnpj(row[idx.CNPJ_Companhia] || "");
    if (cnpj.length !== 14 || /^0+$/.test(cnpj)) continue;
    const list = byCnpj.get(cnpj) || [];
    list.push(code);
    byCnpj.set(cnpj, list);
  }
  return byCnpj;
}

async function loadYearMap(year: number): Promise<Map<string, string>> {
  const res = await fetch(fcaZipUrl(year), {
    next: { revalidate: 86_400 },
    headers: { "User-Agent": "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)" },
  });
  if (!res.ok) return new Map();
  const buf = Buffer.from(await res.arrayBuffer());
  const csv = unzipNamed(buf, (name) => /valor_mobiliario/i.test(name));
  const grouped = parseValorMobiliario(csv);
  const map = new Map<string, string>();
  for (const [cnpj, codes] of grouped) {
    const ticker = pickPreferred(codes);
    if (ticker) map.set(cnpj, `${ticker}.SA`);
  }
  return map;
}

export async function loadB3TickerMap(): Promise<Map<string, string>> {
  const year = new Date().getFullYear();
  try {
    const current = await loadYearMap(year);
    if (current.size > 50) return current;
    const prev = await loadYearMap(year - 1);
    for (const [cnpj, ticker] of prev) {
      if (!current.has(cnpj)) current.set(cnpj, ticker);
    }
    return current;
  } catch {
    return new Map();
  }
}
