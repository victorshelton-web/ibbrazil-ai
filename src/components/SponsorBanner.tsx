"use client";

import { useI18n } from "./LocaleProvider";

const ZLAB_URL = "https://www.ziiplab.com";

export function SponsorBanner() {
  const { t } = useI18n();

  return (
    <a
      href={ZLAB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex max-w-full items-center gap-2.5 rounded-sm border border-border bg-card/60 px-3 py-1.5 no-underline hover:border-[color:var(--gold)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
    >
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase group-hover:text-zinc-200">
        {t.sponsored}
      </span>
      <img
        src="/zlab-logo.png"
        alt="ZLAB"
        width={512}
        height={512}
        className="h-10 w-10 shrink-0 object-contain md:h-12 md:w-12"
      />
    </a>
  );
}
