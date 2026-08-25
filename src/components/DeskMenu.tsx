"use client";

import { useI18n } from "./LocaleProvider";

export type DeskView = "news" | "fatos";

export function DeskMenu({
  view,
  onChange,
}: {
  view: DeskView;
  onChange: (view: DeskView) => void;
}) {
  const { t } = useI18n();

  return (
    <nav className="border-b border-border bg-card/40" aria-label={t.title}>
      <div className="mx-auto flex max-w-[1400px] px-4 md:px-6">
        <div role="tablist" aria-label={t.title} className="flex min-w-0 flex-wrap">
          {(
            [
              { id: "news", label: t.menuNews },
              { id: "fatos", label: t.menuFatos },
            ] as const
          ).map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => onChange(item.id)}
              className={`h-10 px-3 font-mono text-[11px] tracking-wide uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] ${
                idx === 1 ? "border-l border-border" : ""
              } ${
                view === item.id
                  ? "bg-[color:var(--gold)] text-[#14140f]"
                  : "text-zinc-300 hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
