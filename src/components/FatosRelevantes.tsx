"use client";

import { useEffect, useMemo, useState } from "react";
import type { FatoGroup, FatosFeed } from "@/lib/fatos-relevantes";
import { quotesMatchTicker, useDesk } from "./DeskContext";
import { useI18n } from "./LocaleProvider";
import { PartyName } from "./PartyName";
import { SourceLink } from "./SourceLink";

const GROUPS: FatoGroup[] = [
  "ma",
  "dividend",
  "offer",
  "buyback",
  "reorg",
  "gov",
  "earnings",
  "clarify",
  "other",
];

function groupLabel(group: FatoGroup, locale: "en" | "pt"): string {
  const en: Record<FatoGroup, string> = {
    ma: "M&A / control",
    dividend: "Dividends",
    offer: "Offers / capital",
    buyback: "Buybacks",
    reorg: "Restructuring",
    gov: "Governance",
    earnings: "Earnings / guidance",
    clarify: "Clarifications",
    other: "Other",
  };
  const pt: Record<FatoGroup, string> = {
    ma: "M&A / controle",
    dividend: "Dividendos",
    offer: "Ofertas / capital",
    buyback: "Recompras",
    reorg: "Reestruturação",
    gov: "Governança",
    earnings: "Resultados / guidance",
    clarify: "Esclarecimentos",
    other: "Outros",
  };
  return locale === "pt" ? pt[group] : en[group];
}

function formatDay(isoDate: string, locale: "en" | "pt"): string {
  return new Date(`${isoDate}T15:00:00-03:00`).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-GB",
    { weekday: "short", day: "2-digit", month: "short", year: "numeric" },
  );
}

export function FatosRelevantes({
  feed,
  variant = "fatos",
}: {
  feed: FatosFeed;
  variant?: "fatos" | "comunicados";
}) {
  const { locale, t } = useI18n();
  const { tickerQuery } = useDesk();
  const [group, setGroup] = useState<FatoGroup | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!tickerQuery) return;
    setQuery(tickerQuery);
    setGroup("all");
    const id = `hit-${variant}-${tickerQuery.toUpperCase()}`;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [tickerQuery, variant]);
  const headingId = variant === "comunicados" ? "comunicados-b3" : "fatos-b3";
  const kicker = variant === "comunicados" ? t.secComunicadosKicker : t.secFatosKicker;
  const title = variant === "comunicados" ? t.secComunicados : t.secFatos;
  const blurb = variant === "comunicados" ? t.blurbComunicados : t.blurbFatos;
  const countLabel = variant === "comunicados" ? t.comunicadosCount : t.fatosCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.items.filter((item) => {
      if (group !== "all" && item.group !== group) return false;
      if (!q) return true;
      const tickers = (item.quotes || []).map((q) => q.ticker.replace(/\.SA$/, "")).join(" ");
      return `${item.company} ${item.subject} ${tickers}`.toLowerCase().includes(q);
    });
  }, [feed.items, group, query]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = map.get(item.deliveredAt) || [];
      list.push(item);
      map.set(item.deliveredAt, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const chip =
    "h-7 rounded-sm border px-2.5 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]";

  return (
    <section aria-labelledby={headingId} className="border border-border bg-card/40">
      <div className="border-b border-border px-3 py-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--gold)] uppercase">
          {kicker}
        </p>
        <h2 id={headingId} className="text-lg font-semibold text-zinc-100">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">{blurb}</p>
        <p className="mt-1 font-mono text-[11px] text-[color:var(--gold)]">
          {feed.counts.all} {countLabel} · {feed.companyCount} {t.fatosCompanies} ·{" "}
          {feed.windowDays} {t.fatosDays} · CVM IPE
        </p>
      </div>

      <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={title}>
          <button
            type="button"
            aria-pressed={group === "all"}
            onClick={() => setGroup("all")}
            className={`${chip} ${
              group === "all"
                ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[#14140f]"
                : "border-border text-zinc-300 hover:bg-muted"
            }`}
          >
            {t.filterAll} ({feed.counts.all})
          </button>
          {GROUPS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={group === id}
              onClick={() => setGroup(id)}
              className={`${chip} ${
                group === id
                  ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[#14140f]"
                  : "border-border text-zinc-300 hover:bg-muted"
              }`}
            >
              {groupLabel(id, locale)} ({feed.counts[id]})
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.fatosSearch}
          className="h-8 w-full rounded-sm border border-border bg-background px-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground md:max-w-md"
        />
      </div>

      <div className="divide-y divide-border">
        {byDay.map(([day, rows]) => (
          <div key={day} className="px-3 py-3">
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              {formatDay(day, locale)} · {rows.length}
            </p>
            <ul className="space-y-2">
              {rows.map((item, i) => (
                <li
                  key={`${item.id}-${item.deliveredAt}-${i}`}
                  id={
                    tickerQuery && i === 0 && day === byDay[0]?.[0]
                      ? `hit-${variant}-${tickerQuery.toUpperCase()}`
                      : undefined
                  }
                  className={`grid gap-1 border bg-background/40 px-3 py-2 md:grid-cols-[minmax(0,220px)_1fr_auto] md:items-start md:gap-4 ${
                    tickerQuery && quotesMatchTicker(item.quotes, tickerQuery)
                      ? "border-[color:var(--gold)]"
                      : "border-border"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-100">
                      <PartyName name={item.company} quotes={item.quotes} />
                    </div>
                    <p className="font-mono text-[10px] text-[color:var(--gold)] uppercase">
                      {groupLabel(item.group, locale)}
                    </p>
                  </div>
                  <SourceLink
                    href={item.url}
                    type={item.url ? "application/pdf" : undefined}
                    className="text-xs leading-relaxed text-zinc-300 underline-offset-2 hover:text-[color:var(--gold)] hover:underline"
                  >
                    {item.subject}
                  </SourceLink>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      type="application/pdf"
                      className="font-mono text-[11px] text-[color:var(--live)] underline-offset-2 hover:underline"
                    >
                      PDF
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">{t.empty}</p>
        ) : null}
      </div>
    </section>
  );
}
