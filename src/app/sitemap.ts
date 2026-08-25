import type { MetadataRoute } from "next";
import { buildFeed } from "@/lib/feed";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { stats } = await buildFeed();
  const lastModified = new Date(stats.lastUpdatedIso);

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/rss.xml`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.4,
    },
  ];
}
