"use client";

import { useMemo, useState, useTransition } from "react";
import type { FeedCategory, FeedItem } from "@/lib/types";
import { DealCard } from "./DealCard";
import { sectionBlurb, sectionTitle } from "@/lib/format";

const FILTERS: { id: "all" | FeedCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "brazil-ma", label: "Brazil" },
  { id: "international-ma", label: "International" },
  { id: "brazil-news", label: "Corporate News" },
];

const SECTIONS: FeedCategory[] = ["brazil-ma", "international-ma", "brazil-news"];

export function TerminalBoard({ items }: { items: FeedItem[] }) {
  const [filter, setFilter] = useState<"all" | FeedCategory>("all");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!q) return true;
      const hay = [
        item.headline,
        item.acquirer,
        item.target,
        item.sector,
        item.highlights,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query]);

  const sections = SECTIONS.filter(
    (cat) => filter === "all" || filter === cat,
  ).map((cat) => ({
    cat,
    rows: filtered.filter((i) => i.category === cat),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border border-border bg-card/40 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => startTransition(() => setFilter(f.id))}
              className={`px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors ${
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

      <p className={`font-mono text-[11px] text-muted-foreground ${pending ? "opacity-60" : ""}`}>
        Showing {filtered.length} rows · cards view
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
        </section>
      ))}
    </div>
  );
}
