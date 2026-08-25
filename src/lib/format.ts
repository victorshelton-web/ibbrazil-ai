import type { FeedItem, Provenance } from "@/lib/types";

export function getFx(): number {
  return Number(process.env.NEXT_PUBLIC_FX_BRL_USD || process.env.FX_BRL_USD || "5.16");
}

function formatUsd(usd: number): string {
  const abs = Math.abs(usd);
  if (abs >= 1_000_000_000) {
    const v = usd / 1_000_000_000;
    const text = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
    return `$${text}B`;
  }
  if (abs >= 1_000_000) {
    const v = usd / 1_000_000;
    const text = Number.isInteger(v) ? String(v) : (Math.round(v * 10) / 10).toFixed(1);
    return `$${text}M`;
  }
  return `$${usd.toLocaleString("en-US")}`;
}

function formatBrl(brl: number): string {
  const abs = Math.abs(brl);
  if (abs >= 1_000_000_000) {
    const v = brl / 1_000_000_000;
    return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 })} bi`;
  }
  if (abs >= 1_000_000) {
    const v = brl / 1_000_000;
    return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 })} mi`;
  }
  return `R$ ${brl.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

/** Prefer disclosed USD; if only USD, also show BRL at window FX. */
export function formatMoney(usd: number | null, brl: number | null, fx = getFx()): string {
  if (usd == null && brl == null) return "Undisclosed";
  if (usd != null && brl != null) return `${formatUsd(usd)} / ${formatBrl(brl)}`;
  if (usd != null) return `${formatUsd(usd)} / ${formatBrl(usd * fx)}`;
  return formatBrl(brl as number);
}

export function formatDisclosed(usd: number): string {
  return formatUsd(usd);
}

export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const mins = Math.round(diffMs / 60_000);
  const hours = Math.round(diffMs / 3_600_000);
  const days = Math.round(diffMs / 86_400_000);
  let ago: string;
  if (mins < 60) ago = mins <= 1 ? "just now" : `${mins} min ago`;
  else if (hours < 48) ago = hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  else ago = days === 1 ? "1 day ago" : `${days} days ago`;

  const brt = d.toLocaleString("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
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

export function formatUtcLong(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "UTC",
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
      return "Feed offline";
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

export function partyLabels(kind: FeedItem["kind"]): { left: string; right: string } {
  return kind === "news"
    ? { left: "Company", right: "Topic" }
    : { left: "Acquirer", right: "Target" };
}
