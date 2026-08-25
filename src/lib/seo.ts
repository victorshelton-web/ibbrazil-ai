import type { Metadata } from "next";
import type { FeedItem } from "./types";

export const SITE_URL = "https://ibbrazil.ai";
export const SITE_NAME = "ibbrazil.ai";
export const SITE_HANDLE = "@ibbrazil";

export const SEO_TITLE =
  "M&A News Brazil & Global | Mergers, Acquisitions, Fusões e Aquisições";

export const SEO_DESCRIPTION =
  "Live M&A news: Brazilian and global mergers, acquisitions, private equity, VC and corporate-control deals. Notícias de fusões e aquisições no Brasil e no mundo — PE, venture capital e transações cross-border.";

export const SEO_KEYWORDS = [
  "M&A",
  "M&A news",
  "mergers and acquisitions",
  "mergers",
  "acquisitions",
  "fusões e aquisições",
  "fusão",
  "aquisição",
  "M&A Brasil",
  "Brazil M&A",
  "notícias de M&A",
  "private equity",
  "private equity Brasil",
  "venture capital",
  "venture capital Brasil",
  "deal news",
  "investment banking Brazil",
  "transações corporativas",
  "cross-border M&A",
  "mid-market M&A",
  "LBO",
  "takeover",
  "CADE",
  "CVM",
  "corporate news Brazil",
  "notícias corporativas",
  "ibbrazil",
  "ibbrazil.ai",
];

export const NEWS_KEYWORDS = [
  "M&A",
  "mergers",
  "acquisitions",
  "fusões e aquisições",
  "Brazil",
  "Brasil",
  "private equity",
  "venture capital",
  "deals",
].join(", ");

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function jsonSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function seoItemUrl(item: FeedItem): string {
  return `${SITE_URL}/?d=${encodeURIComponent(item.id)}`;
}

export function latestHeadlines(items: FeedItem[], limit = 6): string[] {
  return items
    .filter((i) => i.provenance !== "needs-api")
    .slice(0, limit)
    .map((i) => i.headline.trim())
    .filter(Boolean);
}

export function buildPageMetadata(items: FeedItem[], lastUpdatedIso: string): Metadata {
  const headlines = latestHeadlines(items, 5);
  const tape = headlines.length ? ` Latest: ${headlines.join(" · ")}` : "";
  const description = `${SEO_DESCRIPTION}${tape}`.slice(0, 320);

  return {
    title: SEO_TITLE,
    description,
    keywords: SEO_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "Business",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
      types: {
        "application/rss+xml": `${SITE_URL}/rss.xml`,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: ["pt_BR"],
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SEO_TITLE,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SEO_TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE,
      description,
      images: ["/opengraph-image"],
    },
    other: {
      "news_keywords": NEWS_KEYWORDS,
      "geo.region": "BR",
      "geo.placename": "Brazil",
      language: "en, pt",
      "article:section": "M&A",
      "article:modified_time": lastUpdatedIso,
    },
  };
}

export function buildJsonLd(items: FeedItem[], lastUpdatedIso: string): string {
  const indexable = items.filter((i) => i.provenance !== "needs-api").slice(0, 40);
  const headlines = latestHeadlines(indexable, 8);

  const organization = {
    "@type": ["NewsMediaOrganization", "Organization"],
    "@id": `${SITE_URL}/#org`,
    name: SITE_NAME,
    legalName: "ibbrazil.ai",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    image: `${SITE_URL}/opengraph-image`,
    description: SEO_DESCRIPTION,
    foundingLocation: {
      "@type": "Place",
      name: "Brazil",
    },
    areaServed: ["BR", "World"],
    knowsAbout: SEO_KEYWORDS,
    sameAs: [SITE_URL],
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: [
      "IB Brazil M&A",
      "Brazil M&A news",
      "Fusões e aquisições Brasil",
    ],
    description: SEO_DESCRIPTION,
    inLanguage: ["en", "pt-BR"],
    publisher: { "@id": `${SITE_URL}/#org` },
  };

  const webPage = {
    "@type": ["CollectionPage", "WebPage"],
    "@id": `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: SEO_TITLE,
    description: `${SEO_DESCRIPTION}${headlines.length ? ` ${headlines.join("; ")}` : ""}`,
    inLanguage: ["en", "pt-BR"],
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: {
      "@type": "Thing",
      name: "Mergers and acquisitions",
      alternateName: ["M&A", "Fusões e aquisições"],
      sameAs: "https://www.wikidata.org/wiki/Q80996",
    },
    keywords: SEO_KEYWORDS.join(", "),
    dateModified: lastUpdatedIso,
    primaryImageOfPage: `${SITE_URL}/opengraph-image`,
    publisher: { "@id": `${SITE_URL}/#org` },
  };

  const articles = indexable.map((item, idx) => {
    const isNews = item.kind === "news";
    return {
      "@type": isNews ? "NewsArticle" : ["NewsArticle", "Article"],
      "@id": `${seoItemUrl(item)}#article`,
      url: seoItemUrl(item),
      mainEntityOfPage: seoItemUrl(item),
      headline: item.headline,
      name: item.headline,
      description: item.highlights || item.headline,
      datePublished: item.publishedAt,
      dateModified: item.publishedAt,
      inLanguage: item.category.startsWith("brazil") ? "pt-BR" : "en",
      articleSection: isNews ? "Corporate News" : "M&A",
      keywords: [
        item.sector,
        item.acquirer,
        item.target,
        "M&A",
        "mergers and acquisitions",
        "fusões e aquisições",
        item.category === "brazil-ma" ? "M&A Brasil" : "global M&A",
      ].filter(Boolean),
      author: { "@id": `${SITE_URL}/#org` },
      publisher: { "@id": `${SITE_URL}/#org` },
      image: `${SITE_URL}/opengraph-image`,
      isPartOf: { "@id": `${SITE_URL}/#webpage` },
      position: idx + 1,
      ...(item.sourceUrl
        ? { citation: item.sourceUrl, sameAs: item.sourceUrl }
        : {}),
      about: [
        { "@type": "Organization", name: item.acquirer },
        { "@type": "Organization", name: item.target },
      ],
    };
  });

  const itemList = {
    "@type": "ItemList",
    "@id": `${SITE_URL}/#deals`,
    name: "Live Brazil and global M&A news",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: articles.length,
    itemListElement: articles.map((article, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: article.url,
      item: { "@id": article["@id"] },
    })),
  };

  return jsonSafe({
    "@context": "https://schema.org",
    "@graph": [organization, website, webPage, itemList, ...articles],
  });
}

export function buildRssXml(items: FeedItem[], lastUpdatedIso: string): string {
  const indexable = items.filter((i) => i.provenance !== "needs-api").slice(0, 50);
  const entries = indexable
    .map((item) => {
      const link = seoItemUrl(item);
      const source = item.sourceUrl
        ? `<p>Source: <a href="${xmlEscape(item.sourceUrl)}">${xmlEscape(item.sourceName)}</a></p>`
        : "";
      return `    <item>
      <title>${xmlEscape(item.headline)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <category>${xmlEscape(item.kind === "news" ? "Corporate News" : "M&A")}</category>
      <category>${xmlEscape(item.sector)}</category>
      <description><![CDATA[<p>${xmlEscape(item.highlights || item.headline)}</p>${source}]]></description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SEO_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEscape(SEO_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(lastUpdatedIso).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${entries}
  </channel>
</rss>
`;
}

export function buildNewsSitemapXml(items: FeedItem[]): string {
  const twoDaysAgo = Date.now() - 48 * 3_600_000;
  const recent = items
    .filter((i) => i.provenance !== "needs-api")
    .filter((i) => new Date(i.publishedAt).getTime() >= twoDaysAgo)
    .slice(0, 80);

  const urls = recent
    .map((item) => {
      const lang = item.category.startsWith("brazil") ? "pt" : "en";
      return `  <url>
    <loc>${xmlEscape(seoItemUrl(item))}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_NAME}</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${xmlEscape(item.publishedAt)}</news:publication_date>
      <news:title>${xmlEscape(item.headline)}</news:title>
      <news:keywords>${xmlEscape(`${item.sector}, M&A, mergers, acquisitions, fusões e aquisições`)}</news:keywords>
    </news:news>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;
}
