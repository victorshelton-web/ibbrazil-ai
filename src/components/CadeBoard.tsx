"use client";

import { useMemo, useState } from "react";
import type { CadeFeed, CadeGroup } from "@/lib/cade";
import { useI18n } from "./LocaleProvider";

const GROUPS: CadeGroup[] = ["approved", "restricted", "review", "agenda", "other"];

function groupLabel(group: CadeGroup, locale: "en" | "pt"): string {
  const en: Record<CadeGroup, string> = {
    approved: "Approved",
    restricted: "With remedies",
    review: "Under review",
    agenda: "Hearing agenda",
    other: "Other",
  };
  const pt: Record<CadeGroup, string> = {
    approved: "Aprovado",
    restricted: "Com restrições",
    review: "Em análise",
    agenda: "Pauta",
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

export function CadeBoard({ feed }: { feed: CadeFeed }) {
  const { locale, t } = useI18n();
  const [group, setGroup] = useState<CadeGroup | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.items.filter((item) => {
      if (group !== "all" && item.group !== group) return false;
      if (!q) return true;
      return `${item.title} ${item.summary} ${item.kicker}`.toLowerCase().includes(q);
    });
  }, [feed.items, group, query]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = map.get(item.publishedAt) || [];
      list.push(item);
      map.set(item.publishedAt, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const chip =
    "h-7 rounded-sm border px-2.5 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]";

  return (
    <section aria-labelledby="cade-ac" className="border border-border bg-card/40">
      <div className="border-b border-border px-3 py-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--gold)] uppercase">
          {t.secCadeKicker}
        </p>
        <h2 id="cade-ac" className="text-lg font-semibold text-zinc-100">
          {t.secCade}
        </h2>
        <p className="text-xs text-muted-foreground">{t.blurbCade}</p>
        <p className="mt-1 font-mono text-[11px] text-[color:var(--gold)]">
          {feed.counts.all} {t.cadeCount} · {feed.windowDays} {t.fatosDays} · CADE
        </p>
      </div>

      <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.secCade}>
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
          placeholder={t.cadeSearch}
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
              {rows.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-1 border border-border bg-background/40 px-3 py-2 md:grid-cols-[minmax(0,180px)_1fr_auto] md:items-start md:gap-4"
                >
                  <div>
                    <p className="font-mono text-[10px] text-[color:var(--gold)] uppercase">
                      {groupLabel(item.group, locale)}
                    </p>
                    {item.kicker ? (
                      <p className="text-[11px] text-muted-foreground">{item.kicker}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                    {item.summary ? (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{item.summary}</p>
                    ) : null}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-[color:var(--live)] underline-offset-2 hover:underline"
                  >
                    CADE
                  </a>
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
