import type { FeedItem } from "@/lib/types";
import {
  formatMoney,
  formatWhen,
  partyLabels,
  provenanceClass,
  provenanceLabel,
} from "@/lib/format";

export function DealsTable({
  rows,
  caption = "M&A and news tape",
}: {
  rows: FeedItem[];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-card/80">
          <tr className="border-b border-border font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            <th className="px-3 py-2 font-medium">Acquirer / Company</th>
            <th className="px-3 py-2 font-medium">Target / Topic</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Flag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const labels = partyLabels(item.kind);
            return (
              <tr key={item.id} className="border-b border-border/80 align-top hover:bg-card/60">
                <td className="max-w-[240px] whitespace-normal break-words px-3 py-2.5 text-zinc-100">
                  <span className="mb-0.5 block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    {labels.left}
                  </span>
                  {item.acquirer}
                </td>
                <td className="max-w-[260px] whitespace-normal break-words px-3 py-2.5 text-zinc-200">
                  <span className="mb-0.5 block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                    {labels.right}
                  </span>
                  {item.target}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-[color:var(--gold)]">
                  {item.kind === "news" ? "n/a" : formatMoney(item.valueUsd, item.valueBrl)}
                </td>
                <td className="min-w-[140px] whitespace-normal break-words px-3 py-2.5 font-mono text-[11px] text-[color:var(--gold)]">
                  {formatWhen(item.publishedAt)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${provenanceClass(item.provenance)}`}
                  >
                    {provenanceLabel(item.provenance)}
                  </span>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-sm text-muted-foreground">
                No rows in this filter.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
