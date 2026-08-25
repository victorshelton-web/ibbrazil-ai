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

const chip =
  "h-7 rounded-sm border px-2.5 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]";

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
    <div>
      <div className="flex flex-col gap-3 border border-border bg-card/40 p-3">
        <div role="group" aria-label="Category filter" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => startTransition(() => setFilter(f.id))}
              className={`${chip} ${
                filter === f.id
                  ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[#14140f]"
                  : "border-border text-zinc-300 hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
          <label className="md:col-span-4" htmlFor="tape-search">
            <span className="mb-1 block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Search
            </span>
            <input
              id="tape-search"
              type="search"
              value={query}
              onChange={(e) => startTransition(() => setQuery(e.target.value))}
              placeholder="Acquirer, target, sector, headline"
              className="h-8 w-full rounded-sm border border-border bg-background px-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>

          <label className="md:col-span-2" htmlFor="tape-sector">
            <span className="mb-1 block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Sector
            </span>
            <select
              id="tape-sector"
              value={sector}
              onChange={(e) => startTransition(() => setSector(e.target.value))}
              className="h-8 w-full rounded-sm border border-border bg-background px-2 font-sans text-sm text-foreground"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All sectors" : s}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2" htmlFor="tape-value">
            <span className="mb-1 block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Deal value
            </span>
            <select
              id="tape-value"
              value={valueFilter}
              onChange={(e) =>
                startTransition(() => setValueFilter(e.target.value as ValueFilter))
              }
              className="h-8 w-full rounded-sm border border-border bg-background px-2 font-sans text-sm text-foreground"
            >
              <option value="any">Any value</option>
              <option value="lt100">&lt; $100m</option>
              <option value="mid">$100m – $1bn</option>
              <option value="gt1b">&gt; $1bn</option>
              <option value="undisclosed">Undisclosed</option>
            </select>
          </label>

          <label className="md:col-span-2" htmlFor="tape-sort">
            <span className="mb-1 block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Sort
            </span>
            <select
              id="tape-sort"
              value={sort}
              onChange={(e) => startTransition(() => setSort(e.target.value as SortMode))}
              className="h-8 w-full rounded-sm border border-border bg-background px-2 font-sans text-sm text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="value-desc">Value desc</option>
              <option value="value-asc">Value asc</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <span className="mb-1 block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              M&A view
            </span>
            <div
              role="group"
              aria-label="Cards or table"
              className="flex h-8 overflow-hidden rounded-sm border border-border"
            >
              {(["cards", "table"] as ViewMode[]).map((mode, idx) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => startTransition(() => setView(mode))}
                  className={`h-full flex-1 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] ${
                    idx === 1 ? "border-l border-border" : ""
                  } ${
                    view === mode
                      ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)]"
                      : "text-zinc-300 hover:bg-muted"
                  }`}
                >
                  {mode === "cards" ? "Cards" : "Table"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p
          className={`font-mono text-[11px] text-[color:var(--gold)] ${pending ? "opacity-70" : ""}`}
        >
          Showing {filtered.length} row{filtered.length === 1 ? "" : "s"} · {filterLabel} · {view}{" "}
          view
        </p>
      </div>

      {sections.map((section, idx) => (
        <section
          key={section.cat}
          aria-labelledby={section.cat}
          className="mt-8"
        >
          <div className="mb-3 flex items-end justify-between gap-3 border-b border-border pb-2">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--gold)] uppercase">
                Section {String(idx + 1).padStart(2, "0")}
              </p>
              <h2 id={section.cat} className="text-lg font-semibold text-zinc-100">
                {sectionTitle(section.cat)}
              </h2>
              <p className="text-xs text-muted-foreground">{sectionBlurb(section.cat)}</p>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {section.rows.length} row{section.rows.length === 1 ? "" : "s"}
            </p>
          </div>

          {view === "table" ? (
            <DealsTable rows={section.rows} caption={sectionTitle(section.cat)} />
          ) : (
            <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {section.rows.map((item) => (
                <li key={item.id}>
                  <DealCard item={item} />
                </li>
              ))}
              {section.rows.length === 0 ? (
                <li className="border border-dashed border-border px-3 py-6 text-sm text-muted-foreground xl:col-span-2">
                  No rows in this filter.
                </li>
              ) : null}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
