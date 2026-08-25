import type { FeedStats } from "@/lib/types";
import { formatBrtLong, formatDisclosed, formatUtcLong } from "@/lib/format";

export function StatsStrip({ stats }: { stats: FeedStats }) {
  const cells = [
    {
      label: "Brazilian M&A",
      value: String(stats.brazilLive),
      hint: "Live deals in window",
    },
    {
      label: "International M&A",
      value: String(stats.internationalLive),
      hint: stats.apiConnected ? "Live global deals" : "Curated global deals",
    },
    {
      label: "Brazil corporate news",
      value: String(stats.newsCount),
      hint: "Non-deal, market-moving",
    },
    {
      label: "Disclosed deal value",
      value: formatDisclosed(stats.disclosedUsd),
      hint: `$${stats.disclosedUsd.toLocaleString("en-US")} live disclosed. ${stats.undisclosedLive} live deals undisclosed. Earn-outs and placeholders excluded. FX ${stats.fx} BRL/USD.`,
    },
    {
      label: "Last updated",
      value: `${formatBrtLong(stats.lastUpdatedIso)} BRT`,
      hint: `${formatUtcLong(stats.lastUpdatedIso)} UTC · ${stats.apiConnected ? stats.apiSource : "API offline"}`,
    },
  ];

  return (
    <div className="stats-strip grid divide-y divide-border border-y border-border md:grid-cols-5 md:divide-x md:divide-y-0">
      {cells.map((c) => (
        <div key={c.label} className="px-4 py-3 md:px-5">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            {c.label}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-[color:var(--gold)]">
            {c.value}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
