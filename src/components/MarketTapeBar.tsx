"use client";

import { useEffect, useState } from "react";
import type { MarketTape, TapeMarket, TapeQuote } from "@/lib/market-tape";

function formatTapePrice(row: TapeQuote): string {
  if (row.price == null) return "—";
  if (row.label === "IBOV" || row.label === "COMP") {
    return row.price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (row.currency === "BRL") {
    return `R$ ${row.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${row.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function changeClass(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct > 0) return "text-[color:var(--live)]";
  if (pct < 0) return "text-[color:var(--down)]";
  return "text-muted-foreground";
}

function formatPct(pct: number | null): string {
  if (pct == null) return "—";
  const abs = Math.abs(pct).toFixed(2);
  if (pct > 0) return `▲ +${abs}%`;
  if (pct < 0) return `▼ -${abs}%`;
  return `${abs}%`;
}

function QuoteChip({ row }: { row: TapeQuote }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 px-3 font-mono text-[11px] tracking-wide">
      <span className="text-zinc-200">{row.label}</span>
      <span className="text-[color:var(--gold)]">{formatTapePrice(row)}</span>
      <span className={changeClass(row.changePct)}>{formatPct(row.changePct)}</span>
    </span>
  );
}

export function MarketTapeBar({ tape }: { tape: MarketTape }) {
  const [market, setMarket] = useState<TapeMarket>("b3");

  useEffect(() => {
    const saved = window.localStorage.getItem("ibb-tape");
    if (saved === "b3" || saved === "nasdaq") setMarket(saved);
  }, []);

  const setTape = (next: TapeMarket) => {
    setMarket(next);
    window.localStorage.setItem("ibb-tape", next);
  };

  const quotes = market === "b3" ? tape.b3 : tape.nasdaq;
  const loop = quotes.length ? [...quotes, ...quotes] : [];

  return (
    <div className="border-b border-border bg-[#10120e]">
      <div className="flex items-stretch">
        <div
          role="tablist"
          aria-label="Market tape"
          className="flex shrink-0 items-stretch border-r border-border"
        >
          {(["b3", "nasdaq"] as const).map((id, idx) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={market === id}
              onClick={() => setTape(id)}
              className={`h-8 px-3 font-mono text-[11px] uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] ${
                idx === 1 ? "border-l border-border" : ""
              } ${
                market === id
                  ? "bg-[color:var(--gold)] text-[#14140f]"
                  : "text-zinc-300 hover:bg-muted"
              }`}
            >
              {id === "b3" ? "B3" : "Nasdaq"}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          {loop.length ? (
            <div className="tape-track flex w-max items-center py-1.5">
              {loop.map((row, idx) => (
                <QuoteChip key={`${row.ticker}-${idx}`} row={row} />
              ))}
            </div>
          ) : (
            <p className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
              Tape offline
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
