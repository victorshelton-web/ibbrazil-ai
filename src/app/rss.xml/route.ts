import { buildFeed } from "@/lib/feed";
import { buildRssXml } from "@/lib/seo";

export const revalidate = 300;

export async function GET() {
  const { items, stats } = await buildFeed();
  return new Response(buildRssXml(items, stats.lastUpdatedIso), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
