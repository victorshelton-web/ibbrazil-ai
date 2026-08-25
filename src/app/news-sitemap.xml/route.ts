import { buildFeed } from "@/lib/feed";
import { buildNewsSitemapXml } from "@/lib/seo";

export const revalidate = 300;

export async function GET() {
  const { items } = await buildFeed();
  return new Response(buildNewsSitemapXml(items), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
