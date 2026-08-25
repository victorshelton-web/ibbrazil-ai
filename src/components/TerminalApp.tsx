"use client";

import { useMemo } from "react";
import type { CadeFeed } from "@/lib/cade";
import type { FatosFeed } from "@/lib/fatos-relevantes";
import type { MarketTape } from "@/lib/market-tape";
import type { FeedItem, FeedStats } from "@/lib/types";
import { CadeBoard } from "./CadeBoard";
import { DeskProvider, useDesk } from "./DeskContext";
import { DeskMenu } from "./DeskMenu";
import { TickerJumpBar } from "./TickerJumpBar";
import { FatosRelevantes } from "./FatosRelevantes";
import { LangToggle } from "./LangToggle";
import { LocaleProvider, useI18n } from "./LocaleProvider";
import { MarketTapeBar } from "./MarketTapeBar";
import { SponsorBanner } from "./SponsorBanner";
import { RefreshTape } from "./RefreshTape";
import { StatsStrip } from "./StatsStrip";
import { TerminalBoard } from "./TerminalBoard";

function Shell({
  items,
  stats,
  windowLabel,
  tape,
  fatos,
  comunicados,
  cade,
}: {
  items: FeedItem[];
  stats: FeedStats;
  windowLabel: string;
  tape: MarketTape;
  fatos: FatosFeed;
  comunicados: FatosFeed;
  cade: CadeFeed;
}) {
  const { t } = useI18n();
  const { view, setView } = useDesk();

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
            <div className="flex items-center gap-2">
              <LangToggle />
              <RefreshTape />
            </div>
          </div>
          <div className="flex w-full justify-center">
            <SponsorBanner />
          </div>
        </div>
      </header>

      <MarketTapeBar tape={tape} />

      <StatsStrip stats={stats} />

      <DeskMenu view={view} onChange={setView} />
      <TickerJumpBar />

      <main className="mx-auto max-w-[1400px] space-y-8 px-4 py-4 md:px-6">
        {view === "news" ? <TerminalBoard items={items} /> : null}
        {view === "fatos" ? <FatosRelevantes feed={fatos} variant="fatos" /> : null}
        {view === "comunicados" ? (
          <FatosRelevantes feed={comunicados} variant="comunicados" />
        ) : null}
        {view === "cade" ? <CadeBoard feed={cade} /> : null}
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
              href="https://www.ziiplab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--gold)] underline-offset-2 hover:underline"
            >
              ZLAB
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
  tape: MarketTape;
  fatos: FatosFeed;
  comunicados: FatosFeed;
  cade: CadeFeed;
}) {
  const catalog = useMemo(
    () => ({
      items: props.items,
      fatos: props.fatos,
      comunicados: props.comunicados,
      cade: props.cade,
    }),
    [props.items, props.fatos, props.comunicados, props.cade],
  );

  return (
    <LocaleProvider>
      <DeskProvider catalog={catalog}>
        <Shell {...props} />
      </DeskProvider>
    </LocaleProvider>
  );
}
