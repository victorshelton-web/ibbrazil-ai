"use client";

import { useI18n } from "./LocaleProvider";

export function LangToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="tablist"
      aria-label="Language"
      className="flex h-8 overflow-hidden rounded-sm border border-border"
    >
      {(["en", "pt"] as const).map((l, idx) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={locale === l}
          onClick={() => setLocale(l)}
          className={`h-full px-2.5 font-mono text-[11px] uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] ${
            idx === 1 ? "border-l border-border" : ""
          } ${
            locale === l
              ? "bg-[color:var(--gold)] text-[#14140f]"
              : "text-zinc-300 hover:bg-muted"
          }`}
        >
          {l === "pt" ? "PT" : "EN"}
        </button>
      ))}
    </div>
  );
}
