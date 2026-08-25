import type { Metadata } from "next";
import { buildFeed } from "@/lib/feed";
import { StatsStrip } from "@/components/StatsStrip";
import { TerminalBoard } from "@/components/TerminalBoard";
import { RefreshTape } from "@/components/RefreshTape";
import { LifetimeSponsor } from "@/components/LifetimeSponsor";
import { formatBrtLong } from "@/lib/format";

export const revalidate = 300;

function windowBounds(iso: string) {
  const end = new Date(iso);
  const start = new Date(end.getTime() - 24 * 3_600_000);
  const fmt = (d: Date) =>
    d.toLocaleString("en-GB", {
      timeZone: "America/Toronto",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return `${fmt(start)} America/Toronto — ${fmt(end)} America/Toronto`;
}

export async function generateMetadata(): Promise<Metadata> {
  const { stats } = await buildFeed();
  const asOf = formatBrtLong(stats.lastUpdatedIso);
  return {
    title: `Brazil + Global M&A Terminal — ${asOf}`,
    description:
      "Operator dashboard of Brazilian and international M&A plus major Brazilian corporate news.",
    openGraph: {
      title: "ibbrazil.ai — Brazil + Global M&A Terminal",
      description:
        "Brazilian and international M&A tape with major corporate news for the current window.",
      url: "https://ibbrazil.ai",
      siteName: "ibbrazil.ai",
      type: "website",
    },
    alternates: { canonical: "https://ibbrazil.ai" },
  };
}

export default async function Home() {
  const { items, stats } = await buildFeed();
  const window = windowBounds(stats.lastUpdatedIso);

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--gold)] uppercase">
                M&A / Business News Terminal
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">
                Brazil + Global deal tape
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Operator view of domestic Brazil M&A and VC, major international transactions,
                and market-moving Brazilian corporate news. Window {window}.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <LifetimeSponsor compact />
              <RefreshTape />
            </div>
          </div>
        </div>
      </header>

      <div
        role="status"
        className="border-b border-[color:var(--estimated)]/35 bg-[color:var(--estimated)]/8"
      >
        <p className="mx-auto max-w-[1400px] px-4 py-2 font-mono text-[11px] text-[color:var(--estimated)] md:px-6">
          Some rows are filing-derived or curated — not live closed deals. Live rows are marked
          green. Placeholders are never a closed deal.
        </p>
      </div>

      <StatsStrip stats={stats} />

      <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-6">
        <TerminalBoard items={items} />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1400px] space-y-1 px-4 py-5 text-[11px] leading-relaxed text-muted-foreground md:px-6">
          <p>
            Data window: {window}. Display clocks use America/Sao_Paulo (BRT) and UTC. Window FX ~
            {stats.fx} BRL/USD.
          </p>
          <p>
            International tape from Financial Modeling Prep (SEC EDGAR). Brazil rows curated from
            public filings and press. Confirm against primary sources. No auth, no paywall.
          </p>
        </div>
      </footer>
    </div>
  );
}
