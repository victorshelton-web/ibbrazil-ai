import type { FeedItem } from "@/lib/types";
import {
  formatMoney,
  formatWhen,
  provenanceClass,
  provenanceLabel,
} from "@/lib/format";

type Props = {
  rows: FeedItem[];
};

/** Full-text table — no ellipsis / truncate on acquirer or target. */
export function DealsTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-card/80">
          <tr className="border-b border-border font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            <th className="px-3 py-2 font-medium">Acquirer</th>
            <th className="px-3 py-2 font-medium">Target</th>
            <th className="px-3 py-2 font-medium">Sector</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Flag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/80 align-top transition-colors hover:bg-card/60"
            >
              <td className="max-w-[220px] whitespace-normal break-words px-3 py-2.5 text-zinc-100">
                {item.acquirer}
              </td>
              <td className="max-w-[260px] whitespace-normal break-words px-3 py-2.5 text-zinc-200">
                {item.target}
              </td>
              <td className="whitespace-normal break-words px-3 py-2.5 text-xs text-muted-foreground">
                {item.sector}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-[color:var(--gold)]">
                {item.kind === "news"
                  ? "n/a"
                  : formatMoney(item.valueUsd, item.valueBrl)}
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
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-3 py-6 text-sm text-muted-foreground"
              >
                No rows in this filter.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
