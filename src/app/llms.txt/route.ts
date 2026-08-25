import { buildFeed } from "@/lib/feed";
import { buildLlmsTxt } from "@/lib/ai";

export const revalidate = 300;

export async function GET() {
  const { stats } = await buildFeed();
  return new Response(buildLlmsTxt(stats.lastUpdatedIso), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Robots-Tag": "index, follow, max-snippet:-1",
    },
  });
}
