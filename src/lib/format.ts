import type { FeedItem, Provenance } from "@/lib/types";

const FX = 5.16;

export function formatMoney(usd: number | null, brl: number | null): string {
  if (usd == null && brl == null) return "Undisclosed";
  const parts: string[] = [];
  if (usd != null) {
    if (usd >= 1_000_000_000) parts.push(`$${(usd / 1_000_000_000).toFixed(1)}B`);
    else if (usd >= 1_000_000) parts.push(`$${(usd / 1_000_000).toFixed(1)}M`);
    else parts.push(`$${usd.toLocaleString("en-US")}`);
  }
  if (brl != null) {
    parts.push(
      `R$ ${brl.toLocaleString("pt-BR", { maximumFractionDigits: 1, notation: "compact" })}`.replace(
        " ",
        " ",
      ),
    );
  } else if (usd != null) {
    const asBrl = usd * FX;
    parts.push(
      `R$ ${(asBrl / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`,
    );
  }
  return parts.join(" / ");
}

export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const hours = Math.max(0, Math.round(diffMs / 3_600_000));
  const brt = d.toLocaleString("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const ago = hours < 1 ? "just now" : hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  return `${ago} · ${brt} BRT`;
}

export function formatBrtLong(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function provenanceLabel(p: Provenance): string {
  switch (p) {
    case "live":
      return "Live";
    case "api":
      return "API live";
    case "estimated":
      return "Data Estimated";
    case "needs-api":
      return "Requires API Integration";
  }
}

export function provenanceClass(p: Provenance): string {
  switch (p) {
    case "live":
    case "api":
      return "border-[color:var(--live)]/60 bg-[color:var(--live)]/15 text-[color:var(--live)]";
    case "estimated":
      return "border-[color:var(--estimated)]/60 bg-[color:var(--estimated)]/15 text-[color:var(--estimated)]";
    case "needs-api":
      return "border-[color:var(--needs-api)]/60 bg-[color:var(--needs-api)]/15 text-slate-300";
  }
}

export function sectionTitle(category: FeedItem["category"]): string {
  switch (category) {
    case "brazil-ma":
      return "Brazilian M&A";
    case "international-ma":
      return "International M&A";
    case "brazil-news":
      return "Major Brazilian Corporate News";
  }
}

export function sectionBlurb(category: FeedItem["category"]): string {
  switch (category) {
    case "brazil-ma":
      return "Domestic Brazil M&A, VC rounds, and major corporate-control events.";
    case "international-ma":
      return "Major global M&A and high-impact corporate developments.";
    case "brazil-news":
      return "Market-moving Brazil news that is not a deal — rates, earnings, regulation, large stock moves, macro.";
  }
}

export function formatDisclosed(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  return `$${usd.toLocaleString("en-US")}`;
}
