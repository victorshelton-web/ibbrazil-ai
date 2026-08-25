"use client";

import type { FeedItem, FeedStats } from "@/lib/types";
import { LocaleProvider, useI18n } from "./LocaleProvider";
import { LifetimeSponsor } from "./LifetimeSponsor";
import { RefreshTape } from "./RefreshTape";
import { StatsStrip } from "./StatsStrip";
import { TerminalBoard } from "./TerminalBoard";

function Shell({
  items,
  stats,
  windowLabel,
}: {
  items: FeedItem[];
  stats: FeedStats;
  windowLabel: string;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--gold)] uppercase">
                {t.kicker}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">
                {t.title}
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {t.intro} {windowLabel}.
              </p>
            </div>
            <RefreshTape />
          </div>
          <div className="flex w-full justify-center">
            <LifetimeSponsor />
          </div>
        </div>
      </header>

      <div
        role="status"
        className="border-b border-[color:var(--estimated)]/35 bg-[color:var(--estimated)]/8"
      >
        <p className="mx-auto max-w-[1400px] px-4 py-2 font-mono text-[11px] text-[color:var(--estimated)] md:px-6">
          {t.warning}
        </p>
      </div>

      <StatsStrip stats={stats} />

      <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-6">
        <TerminalBoard items={items} />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1400px] space-y-1 px-4 py-5 text-[11px] leading-relaxed text-muted-foreground md:px-6">
          <p>
            {windowLabel}. {t.footerClock}
            {stats.fx} BRL/USD.
          </p>
          <p>
            {t.footerData} {t.footerSponsor}{" "}
            <a
              href="https://lftm.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--gold)] underline-offset-2 hover:underline"
            >
              Lifetime
            </a>
            . {t.noAuth}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function TerminalApp(props: {
  items: FeedItem[];
  stats: FeedStats;
  windowLabel: string;
}) {
  return (
    <LocaleProvider>
      <Shell {...props} />
    </LocaleProvider>
  );
}
