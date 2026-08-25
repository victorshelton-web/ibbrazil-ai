"use client";

import { useI18n } from "./LocaleProvider";
import { useDesk } from "./DeskContext";
import type { DeskView } from "./DeskMenu";

const TABS: { id: DeskView; labelKey: "menuNews" | "menuFatos" | "menuComunicados" | "menuCade" }[] =
  [
    { id: "news", labelKey: "menuNews" },
    { id: "fatos", labelKey: "menuFatos" },
    { id: "comunicados", labelKey: "menuComunicados" },
    { id: "cade", labelKey: "menuCade" },
  ];

export function TickerJumpBar() {
  const { t } = useI18n();
  const { tickerQuery, hits, sources, view, setView, clearTicker } = useDesk();
  if (!tickerQuery) return null;

  return (
    <div className="border-b border-border bg-card/60">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-4 py-2 md:px-6">
        <p className="font-mono text-[11px] text-[color:var(--gold)]">{tickerQuery}</p>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const count = hits[tab.id];
            const active = view === tab.id;
            const source = sources[tab.id];
            return (
              <span key={tab.id} className="inline-flex overflow-hidden rounded-sm border border-border">
                <button
                  type="button"
                  disabled={count === 0}
                  onClick={() => setView(tab.id)}
                  className={`h-7 px-2 font-mono text-[10px] uppercase ${
                    count === 0
                      ? "cursor-not-allowed text-muted-foreground opacity-50"
                      : active
                        ? "bg-[color:var(--gold)] text-[#14140f]"
                        : "text-zinc-300 hover:bg-muted"
                  }`}
                >
                  {t[tab.labelKey]} {count}
                </button>
                {source ? (
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t.openSource}
                    className="inline-flex h-7 items-center border-l border-border px-1.5 font-mono text-[10px] text-[color:var(--live)] hover:bg-muted"
                  >
                    ↗
                  </a>
                ) : null}
              </span>
            );
          })}
        </div>
        <button
          type="button"
          onClick={clearTicker}
          className="ml-auto font-mono text-[10px] text-muted-foreground underline-offset-2 hover:text-[color:var(--gold)] hover:underline"
        >
          {t.tickerClear}
        </button>
      </div>
    </div>
  );
}
