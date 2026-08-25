"use client";

import { useMemo, useState, useTransition } from "react";
import type { FeedCategory, FeedItem } from "@/lib/types";
import { DealCard } from "./DealCard";
import { DealsTable } from "./DealsTable";
import { sectionBlurb, sectionTitle } from "@/lib/format";

const FILTERS: { id: "all" | FeedCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "brazil-ma", label: "Brazil" },
  { id: "international-ma", label: "International" },
  { id: "brazil-news", label: "Corporate News" },
];

const SECTIONS: FeedCategory[] = ["brazil-ma", "international-ma", "brazil-news"];

type ViewMode = "cards" | "table";
type ValueFilter = "any" | "lt100" | "mid" | "gt1b" | "undisclosed";
type SortMode = "newest" | "value-desc" | "value-asc";

function matchesValue(item: FeedItem, valueFilter: ValueFilter): boolean {
  if (valueFilter === "any") return true;
  if (item.kind === "news") return false;
  if (valueFilter === "undisclosed") return item.valueUsd == null;
  if (item.valueUsd == null) return false;
  if (valueFilter === "lt100") return item.valueUsd < 100_000_000;
  if (valueFilter === "mid")
    return item.valueUsd >= 100_000_000 && item.valueUsd <= 1_000_000_000;
  if (valueFilter === "gt1b") return item.valueUsd > 1_000_000_000;
  return true;
}

function sortItems(items: FeedItem[], sort: SortMode): FeedItem[] {
  const copy = [...items];
  if (sort === "newest") {
    return copy.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }
  if (sort === "value-desc") {
    return copy.sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));
  }
  return copy.sort(
    (a, b) => (a.valueUsd ?? Number.MAX_SAFE_INTEGER) - (b.valueUsd ?? Number.MAX_SAFE_INTEGER),
  );
}

export function TerminalBoard({ items }: { items: FeedItem[] }) {
  const [filter, setFilter] = useState<"all" | FeedCategory>("all");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [valueFilter, setValueFilter] = useState<ValueFilter>("any");
  const [sort, setSort] = useState<SortMode>("newest");
  const [view, setView] = useState<ViewMode>("cards");
  const [pending, startTransition] = useTransition();

  const sectors = useMemo(() => {
    const set = new Set(items.map((i) => i.sector).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (sector !== "all" && item.sector !== sector) return false;
      if (!matchesValue(item, valueFilter)) return false;
      if (!q) return true;
      const hay = [item.headline, item.acquirer, item.target, item.sector, item.highlights]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    return sortItems(base, sort);
  }, [items, filter, query, sector, valueFilter, sort]);

  const sections = SECTIONS.filter((cat) => filter === "all" || filter === cat).map((cat) => ({
    cat,
    rows: filtered.filter((i) => i.category === cat),
  }));

  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? "All";

  return (
    <div className="space-y-8">
      <div className="space-y-3 border border-border bg-card/40 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Section filter">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => startTransition(() => setFilter(f.id))}
                className={`px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--gold)] ${
                  filter === f.id
                    ? "bg-[color:var(--gold)] text-[#0b0c0a]"
                    : "text-muted-foreground hover:text-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex min-w-[220px] flex-1 items-center gap-2 border border-border bg-background px-3 py-2 md:max-w-sm">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Search
            </span>
            <input
              value={query}
              onChange={(e) => startTransition(() => setQuery(e.target.value))}
              placeholder="Acquirer, target, sector…"
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 border border-border bg-background px-3 py-2">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Sector
            </span>
            <select
              value={sector}
              onChange={(e) => startTransition(() => setSector(e.target.value))}
              className="bg-transparent text-sm text-zinc-100 outline-none"
            >
              {sectors.map((s) => (
                <option key={s} value={s} className="bg-[#121410] text-zinc-100">
                  {s === "all" ? "All sectors" : s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 border border-border bg-background px-3 py-2">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Deal value
            </span>
            <select
              value={valueFilter}
              onChange={(e) =>
                startTransition(() => setValueFilter(e.target.value as ValueFilter))
              }
              className="bg-transparent text-sm text-zinc-100 outline-none"
            >
              <option value="any" className="bg-[#121410]">
                Any value
              </option>
              <option value="lt100" className="bg-[#121410]">
                &lt; $100m
              </option>
              <option value="mid" className="bg-[#121410]">
                $100m – $1bn
              </option>
              <option value="gt1b" className="bg-[#121410]">
                &gt; $1bn
              </option>
              <option value="undisclosed" className="bg-[#121410]">
                Undisclosed
              </option>
            </select>
          </label>

          <label className="flex flex-col gap-1 border border-border bg-background px-3 py-2">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => startTransition(() => setSort(e.target.value as SortMode))}
              className="bg-transparent text-sm text-zinc-100 outline-none"
            >
              <option value="newest" className="bg-[#121410]">
                Newest
              </option>
              <option value="value-desc" className="bg-[#121410]">
                Value desc
              </option>
              <option value="value-asc" className="bg-[#121410]">
                Value asc
              </option>
            </select>
          </label>

          <div className="flex flex-col gap-1 border border-border bg-background px-3 py-2">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              M&A view
            </span>
            <div className="flex gap-1" role="group" aria-label="View mode">
              {(["cards", "table"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => startTransition(() => setView(mode))}
                  className={`px-3 py-1 font-mono text-[11px] tracking-wide uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--gold)] ${
                    view === mode
                      ? "bg-[color:var(--gold)] text-[#0b0c0a]"
                      : "text-muted-foreground hover:text-zinc-200"
                  }`}
                >
                  {mode === "cards" ? "Cards" : "Table"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className={`font-mono text-[11px] text-muted-foreground ${pending ? "opacity-60" : ""}`}>
        Showing {filtered.length} rows · {filterLabel} · {view} view
      </p>

      {sections.map((section, idx) => (
        <section key={section.cat} className="space-y-3">
          <header className="space-y-1">
            <p className="font-mono text-[10px] tracking-[0.22em] text-[color:var(--gold)] uppercase">
              Section {String(idx + 1).padStart(2, "0")}
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">
              {sectionTitle(section.cat)}
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {sectionBlurb(section.cat)}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {section.rows.length} rows
            </p>
          </header>

          {view === "table" ? (
            <DealsTable rows={section.rows} caption={sectionTitle(section.cat)} />
          ) : (
            <div className="grid gap-3">
              {section.rows.map((item) => (
                <DealCard key={item.id} item={item} />
              ))}
              {section.rows.length === 0 ? (
                <p className="border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
                  No rows in this filter.
                </p>
              ) : null}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
