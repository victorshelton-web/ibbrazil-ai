import type { FeedStats } from "@/lib/types";
import { formatBrtLong, formatDisclosed, formatUtcLong } from "@/lib/format";

export function StatsStrip({ stats }: { stats: FeedStats }) {
  const cells = [
    {
      label: "Brazilian M&A / VC",
      value: String(stats.brazilLive),
      hint: "Live deals in window",
      gold: false,
    },
    {
      label: "International M&A",
      value: String(stats.internationalLive),
      hint: "Live global deals",
      gold: false,
    },
    {
      label: "Brazil corporate news",
      value: String(stats.newsCount),
      hint: "Non-deal, market-moving",
      gold: false,
    },
    {
      label: "Disclosed deal value",
      value: formatDisclosed(stats.disclosedUsd),
      hint: `$${stats.disclosedUsd.toLocaleString("en-US")} live disclosed. ${stats.undisclosedLive} live deals undisclosed. Earn-outs and placeholders excluded. FX ${stats.fx} BRL/USD.`,
      gold: true,
    },
    {
      label: "Last updated",
      value: `${formatBrtLong(stats.lastUpdatedIso)} BRT`,
      hint: `${formatUtcLong(stats.lastUpdatedIso)} UTC`,
      gold: true,
    },
  ];

  return (
    <section aria-label="Window summary" className="border-b border-border">
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
