"use client";

import type { FeedStats } from "@/lib/types";
import { formatBrtLong, formatDisclosed, formatUtcLong } from "@/lib/format";
import { useI18n } from "./LocaleProvider";

export function StatsStrip({ stats }: { stats: FeedStats }) {
  const { t } = useI18n();
  const cells = [
    {
      label: t.brazilMa,
      value: String(stats.brazilLive),
      hint: t.liveDeals,
      gold: false,
    },
    {
      label: t.intlMa,
      value: String(stats.internationalLive),
      hint: t.liveGlobal,
      gold: false,
    },
    {
      label: t.brazilNews,
      value: String(stats.newsCount),
      hint: t.nonDeal,
      gold: false,
    },
    {
      label: t.disclosed,
      value: formatDisclosed(stats.disclosedUsd),
      hint: `$${stats.disclosedUsd.toLocaleString("en-US")} ${t.earnouts} ${stats.undisclosedLive} ${t.undisclosedDeals} ${stats.fx} BRL/USD.`,
      gold: true,
    },
    {
      label: t.lastUpdated,
      value: `${formatBrtLong(stats.lastUpdatedIso)} BRT`,
      hint: `${formatUtcLong(stats.lastUpdatedIso)} UTC`,
      gold: true,
    },
  ];

  return (
    <section aria-label={t.lastUpdated} className="border-b border-border">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-border md:grid-cols-5 md:divide-y-0">
        {cells.map((c) => (
          <div key={c.label} className="px-4 py-3 md:px-5">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              {c.label}
            </p>
            <p
              className={`mt-1 text-2xl font-semibold tracking-tight ${
                c.gold ? "font-mono text-[color:var(--gold)]" : "text-zinc-100"
              }`}
            >
              {c.value}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
