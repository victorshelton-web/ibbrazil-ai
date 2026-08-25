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

export function DealCard({ item }: { item: FeedItem }) {
  const labels = partyLabels(item.kind);

  return (
    <article className="deal-card border border-border bg-card/80 backdrop-blur-sm transition-[border-color,transform] duration-300 hover:border-[color:var(--gold)]/40">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {item.sector} · {item.status}
        </p>
        <span
          className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${provenanceClass(item.provenance)}`}
        >
          {provenanceLabel(item.provenance)}
        </span>
      </div>

      <h3 className="px-3 pt-3 text-base font-medium leading-snug text-zinc-100 md:text-lg">
        {item.headline}
      </h3>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2 text-xs md:grid-cols-4">
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {labels.left}
          </dt>
          <dd className="mt-0.5 break-words whitespace-normal text-zinc-200">
            {item.acquirer}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {labels.right}
          </dt>
          <dd className="mt-0.5 break-words whitespace-normal text-zinc-200">
            {item.target}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {item.kind === "news" ? "Deal value" : "Est. deal value"}
          </dt>
          <dd className="mt-0.5 font-mono text-[color:var(--gold)]">
            {item.kind === "news" ? "n/a — news" : formatMoney(item.valueUsd, item.valueBrl)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            Timestamp
          </dt>
          <dd className="mt-0.5 font-mono text-[color:var(--gold)]">
            {formatWhen(item.publishedAt)}
          </dd>
        </div>
      </dl>

      <details className="border-t border-border px-3 py-2">
        <summary className="cursor-pointer font-mono text-[11px] text-[color:var(--gold)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--gold)]">
          Highlights & source
        </summary>
        <div className="mt-2 space-y-2 pb-1 text-sm leading-relaxed text-zinc-300">
          <p>{item.highlights}</p>
          {item.valueNote ? (
            <p className="text-xs text-muted-foreground">{item.valueNote}</p>
          ) : null}
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatBrtLong(item.publishedAt)} BRT · {formatUtcLong(item.publishedAt)} UTC
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            Source: {item.sourceName}
            {item.sourceUrl ? (
              <>
                {" · "}
                <a
                  className="text-[color:var(--gold)] underline-offset-2 hover:underline"
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  open filing / article
                </a>
              </>
            ) : null}
          </p>
        </div>
      </details>
    </article>
  );
}
