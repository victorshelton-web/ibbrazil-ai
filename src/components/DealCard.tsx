"use client";

import type { FeedItem } from "@/lib/types";
import {
  formatMoney,
  formatWhen,
  formatBrtLong,
  formatUtcLong,
  partyLabels,
  provenanceClass,
  provenanceLabel,
} from "@/lib/format";
import { useI18n } from "./LocaleProvider";
import { PartyName } from "./PartyName";

export function DealCard({ item }: { item: FeedItem }) {
  const { t } = useI18n();
  const labels = partyLabels(item.kind, t);
  const dashed = item.provenance === "needs-api" || item.provenance === "estimated";

  return (
    <article
      className={`border border-border bg-card/60 ${dashed ? "border-dashed" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {item.sector} · {item.status}
          </p>
          <h3 className="mt-0.5 text-sm font-medium text-zinc-100">{item.headline}</h3>
        </div>
        <span
          className={`inline-flex h-5 w-fit shrink-0 items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${provenanceClass(item.provenance)}`}
        >
          {provenanceLabel(item.provenance, t)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2 text-xs md:grid-cols-4">
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {labels.left}
          </dt>
          <dd className="mt-0.5 break-words whitespace-normal text-zinc-200">
            <PartyName name={item.acquirer} quotes={item.acquirerQuotes} />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {labels.right}
          </dt>
          <dd className="mt-0.5 break-words whitespace-normal text-zinc-200">
            <PartyName name={item.target} quotes={item.targetQuotes} />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {t.estValue}
          </dt>
          <dd className="mt-0.5 font-mono text-[color:var(--gold)]">
            {item.kind === "news" ? t.newsNa : formatMoney(item.valueUsd, item.valueBrl, undefined, t.undisclosed)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {t.timestamp}
          </dt>
          <dd className="mt-0.5 font-mono text-[color:var(--gold)]">
            {formatWhen(item.publishedAt, t)}
          </dd>
        </div>
      </dl>

      <details className="border-t border-border px-3 py-2">
        <summary className="cursor-pointer font-mono text-[11px] text-[color:var(--gold)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]">
          {t.highlights}
        </summary>
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-zinc-300">
          <p>{item.highlights}</p>
          {item.valueNote ? (
            <p className="text-muted-foreground">{item.valueNote}</p>
          ) : null}
          <p className="font-mono text-[11px]">
            {t.source}:{" "}
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--live)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--live)]"
              >
                {item.sourceName}
              </a>
            ) : (
              <span className="text-muted-foreground">
                {item.sourceName} — {t.noUrl}
              </span>
            )}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatBrtLong(item.publishedAt)} BRT · {formatUtcLong(item.publishedAt)} UTC
          </p>
        </div>
      </details>
    </article>
  );
}
