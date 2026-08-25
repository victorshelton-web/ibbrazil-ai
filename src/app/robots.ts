import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/ai";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
      },
      {
        userAgent: "*",
        allow: ["/", "/api/feed"],
        disallow: ["/api/"],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
