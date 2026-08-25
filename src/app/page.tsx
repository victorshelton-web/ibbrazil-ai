import type { Metadata } from "next";
import { buildFeed } from "@/lib/feed";
import { TerminalApp } from "@/components/TerminalApp";
import { formatBrtLong } from "@/lib/format";

export const revalidate = 300;

function windowBounds(iso: string) {
  const end = new Date(iso);
  const start = new Date(end.getTime() - 24 * 3_600_000);
  const fmt = (d: Date) =>
    d.toLocaleString("en-GB", {
      timeZone: "America/Toronto",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return `${fmt(start)} America/Toronto — ${fmt(end)} America/Toronto`;
}

export async function generateMetadata(): Promise<Metadata> {
  const { stats } = await buildFeed();
  const asOf = formatBrtLong(stats.lastUpdatedIso);
  return {
    title: `Brazil + Global M&A Terminal — ${asOf}`,
    description:
      "Operator dashboard of Brazilian and international M&A plus major Brazilian corporate news.",
    openGraph: {
      title: "ibbrazil.ai — Brazil + Global M&A Terminal",
      description:
        "Brazilian and international M&A tape with major corporate news for the current window.",
      url: "https://ibbrazil.ai",
      siteName: "ibbrazil.ai",
      type: "website",
    },
    alternates: { canonical: "https://ibbrazil.ai" },
  };
}

export default async function Home() {
  const { items, stats } = await buildFeed();
  return (
    <TerminalApp
      items={items}
      stats={stats}
      windowLabel={windowBounds(stats.lastUpdatedIso)}
    />
  );
}
