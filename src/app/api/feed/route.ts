import { NextResponse } from "next/server";
import { buildFeed } from "@/lib/feed";

export const revalidate = 300;

export async function GET() {
  const feed = await buildFeed();
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
