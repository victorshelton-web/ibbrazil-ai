import type { Metadata } from "next";
import { loadFatosRelevantes } from "@/lib/fatos-relevantes";
import { buildFeed } from "@/lib/feed";
import { loadMarketTape } from "@/lib/market-tape";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { TerminalApp } from "@/components/TerminalApp";
import { buildPageMetadata } from "@/lib/seo";

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
  const { items, stats } = await buildFeed();
  return buildPageMetadata(items, stats.lastUpdatedIso);
}

export default async function Home() {
  const [{ items, stats }, tape, fatos] = await Promise.all([
    buildFeed(),
    loadMarketTape(),
    loadFatosRelevantes(),
  ]);
  return (
    <>
      <SeoJsonLd items={items} stats={stats} />
      <TerminalApp
        items={items}
        stats={stats}
        windowLabel={windowBounds(stats.lastUpdatedIso)}
        tape={tape}
        fatos={fatos}
      />
    </>
  );
}
