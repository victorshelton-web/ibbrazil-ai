import { buildJsonLd } from "@/lib/seo";
import type { FeedItem } from "@/lib/types";

export function SeoJsonLd({
  items,
  lastUpdatedIso,
}: {
  items: FeedItem[];
  lastUpdatedIso: string;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: buildJsonLd(items, lastUpdatedIso) }}
    />
  );
}
