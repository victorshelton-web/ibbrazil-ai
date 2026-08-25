import { buildFeed } from "@/lib/feed";
import { buildAiJson } from "@/lib/ai";

export const revalidate = 300;

export async function GET() {
  const { items, stats } = await buildFeed();
  return Response.json(buildAiJson(items, stats), {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Robots-Tag": "index, follow, max-snippet:-1",
    },
  });
}
