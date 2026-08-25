import { NextRequest } from "next/server";
import { cvmUpstreamUrl, sniffDocument, type CvmDocRef } from "@/lib/cvm-pdf";

export const runtime = "nodejs";
export const maxDuration = 30;
export const revalidate = 86400;

const UA = "ibbrazil.ai-terminal/1.0 (+https://ibbrazil.ai)";
const MAX_BYTES = 15 * 1024 * 1024;

function refFromRequest(req: NextRequest): CvmDocRef | null {
  const protocolo = req.nextUrl.searchParams.get("p") || "";
  const sequencia = req.nextUrl.searchParams.get("s") || "";
  const versao = req.nextUrl.searchParams.get("v") || "1";
  if (!/^\d{1,12}$/.test(protocolo) || !/^\d{1,12}$/.test(sequencia) || !/^\d{1,4}$/.test(versao)) {
    return null;
  }
  return { protocolo, sequencia, versao };
}

async function fetchFiling(url: string): Promise<Buffer | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/pdf,application/octet-stream,*/*",
    },
    redirect: "follow",
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return null;
  return sniffDocument(buf) ? buf : null;
}

export async function GET(req: NextRequest) {
  const ref = refFromRequest(req);
  if (!ref) return new Response("Invalid document.", { status: 400 });

  const buf =
    (await fetchFiling(cvmUpstreamUrl("ENET", ref))) ||
    (await fetchFiling(cvmUpstreamUrl("ENETWeb", ref)));
  if (!buf) return new Response("Document unavailable.", { status: 502 });

  const kind = sniffDocument(buf);
  if (!kind) return new Response("Document unavailable.", { status: 502 });

  return new Response(buf, {
    headers: {
      "Content-Type": kind.type,
      "Content-Disposition": `inline; filename="cvm-${ref.protocolo}.${kind.ext}"`,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
