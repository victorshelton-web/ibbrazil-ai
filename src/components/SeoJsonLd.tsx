import { buildJsonLd } from "@/lib/seo";
import type { FeedItem, FeedStats } from "@/lib/types";

export function SeoJsonLd({
  items,
  stats,
}: {
  items: FeedItem[];
  stats: FeedStats;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: buildJsonLd(items, stats) }}
    />
  );
}
