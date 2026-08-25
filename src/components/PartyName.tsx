import { useState } from "react";
import type { PartyQuote } from "@/lib/types";
import { displayTicker, useDesk } from "./DeskContext";
import { useI18n } from "./LocaleProvider";

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

export function QuoteLine({ quotes }: { quotes?: PartyQuote[] }) {
  const { t } = useI18n();
  const { openTicker } = useDesk();
  const [open, setOpen] = useState(false);
  const rows = quotes?.filter((q) => q.ticker) ?? [];
  if (!rows.length) return null;
  const visible = open ? rows : rows.slice(0, 3);

  return (
    <>
      {visible.map((q) => (
        <div
          key={q.ticker}
          className="mt-0.5 flex flex-wrap items-baseline gap-1.5 font-mono text-[10px] tracking-wide"
        >
          <button
            type="button"
            onClick={() => openTicker(q.ticker)}
            className="text-muted-foreground underline-offset-2 hover:text-[color:var(--gold)] hover:underline"
          >
            {displayTicker(q.ticker)}
          </button>
          {q.changePct != null ? (
            <span className={changeClass(q.changePct)}>{formatPct(q.changePct)}</span>
          ) : null}
        </div>
      ))}
      {rows.length > 3 ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 font-mono text-[10px] text-[color:var(--gold)] underline-offset-2 hover:underline"
        >
          {open ? t.seeLess : `${t.seeMore} (${rows.length - 3})`}
        </button>
      ) : null}
    </>
  );
}

export function PartyName({
  name,
  quotes,
}: {
  name: string;
  quotes?: PartyQuote[];
}) {
  return (
    <div>
      <div>{stripListedSuffix(name)}</div>
      <QuoteLine quotes={quotes} />
    </div>
  );
}
