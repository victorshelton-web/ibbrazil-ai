import type { PartyQuote } from "@/lib/types";

function displayTicker(symbol: string): string {
  if (symbol === "^BVSP") return "IBOV";
  return symbol.replace(/\.SA$/, "");
}

function stripListedSuffix(name: string): string {
  return name
    .replace(
      /\s*\((?:NYSE|Nasdaq|NASDAQ|NYSE American|NYSE Arca|B3|Bovespa)\s*:[^)]+\)/gi,
      "",
    )
    .replace(/\s*\(([A-Z]{1,6}(?:\.[A-Z]{1,3})?)\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function changeClass(pct: number): string {
  if (pct > 0) return "text-[color:var(--live)]";
  if (pct < 0) return "text-[color:var(--down)]";
  return "text-muted-foreground";
}

function formatPct(pct: number): string {
  const abs = Math.abs(pct).toFixed(2);
  if (pct > 0) return `▲ +${abs}%`;
  if (pct < 0) return `▼ -${abs}%`;
  return `· ${abs}%`;
}

export function PartyName({
  name,
  quotes,
}: {
  name: string;
  quotes?: PartyQuote[];
}) {
  const label = stripListedSuffix(name);
  const rows = quotes?.filter((q) => q.ticker) ?? [];

  return (
    <div>
      <div>{label}</div>
      {rows.map((q) => (
        <div
          key={q.ticker}
          className="mt-0.5 flex flex-wrap items-baseline gap-1.5 font-mono text-[10px] tracking-wide"
        >
          <span className="text-muted-foreground">{displayTicker(q.ticker)}</span>
          {q.changePct != null ? (
            <span className={changeClass(q.changePct)}>{formatPct(q.changePct)}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
