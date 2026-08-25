import type { Metadata } from "next";
import { buildFeed } from "@/lib/feed";
import { StatsStrip } from "@/components/StatsStrip";
import { TerminalBoard } from "@/components/TerminalBoard";
import { formatBrtLong } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { stats } = await buildFeed();
  const asOf = formatBrtLong(stats.lastUpdatedIso);
  return {
    title: `Brazil + Global M&A Terminal — ${asOf} BRT`,
    description:
      "Operator dashboard of Brazilian and international M&A plus major Brazilian corporate news. Live rows marked green.",
    openGraph: {
      title: `ibbrazil.ai — Brazil + Global M&A Terminal`,
      description:
        "Brazilian and international M&A tape with major corporate news for the current window.",
      url: "https://ibbrazil.ai",
      siteName: "ibbrazil.ai",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "ibbrazil.ai — Brazil + Global M&A Terminal",
      description: "Brazilian and international M&A tape with major corporate news.",
    },
    alternates: { canonical: "https://ibbrazil.ai" },
  };
}

export default async function Home() {
  const { items, stats } = await buildFeed();
  const windowLabel = formatBrtLong(stats.lastUpdatedIso);

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--gold)] uppercase">
                M&A / Business News Terminal
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
                <span className="text-[color:var(--gold)]">ibbrazil.ai</span>
                <span className="text-zinc-400"> — Brazil + Global M&A</span>
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Some rows are estimated or filing-derived — not live closed deals. Live rows are
                marked green. Placeholders are never shown as closed transactions.
              </p>
            </div>
            <div className="flex items-center gap-2 border border-border bg-card px-3 py-2">
              <span
                className={`live-dot inline-block size-2 rounded-full ${
                  stats.apiConnected
                    ? "bg-[color:var(--live)]"
                    : "bg-[color:var(--needs-api)]"
                }`}
                aria-hidden
              />
              <div>
                <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Tape status
                </p>
                <p className="font-mono text-xs text-zinc-200">
                  {stats.apiConnected ? "Global feed live" : "Global feed offline"} ·{" "}
                  {windowLabel} BRT
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <StatsStrip stats={stats} />

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <TerminalBoard items={items} />
      </main>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-4 text-[11px] text-muted-foreground md:px-6">
          <p>
            International prints are sourced from Financial Modeling Prep (SEC EDGAR
            disclosures). Brazil rows are curated from public filings and press. Data may lag
            markets; confirm against primary sources. Not investment advice. No auth, no paywall.
          </p>
          <p className="font-mono">
            FX {stats.fx} BRL/USD · refresh ≤5m · {stats.apiSource}
          </p>
        </div>
      </footer>
    </div>
  );
}
