const CVM_HOST = /(^|\.)rad\.cvm\.gov\.br$/i;

export type CvmDocRef = {
  protocolo: string;
  sequencia: string;
  versao: string;
};

export function parseCvmDownloadUrl(link: string | null | undefined): CvmDocRef | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    if (!CVM_HOST.test(url.hostname)) return null;
    const protocolo = url.searchParams.get("numProtocolo") || "";
    const sequencia = url.searchParams.get("numSequencia") || "";
    const versao = url.searchParams.get("numVersao") || "1";
    if (!/^\d{1,12}$/.test(protocolo) || !/^\d{1,12}$/.test(sequencia) || !/^\d{1,4}$/.test(versao)) {
      return null;
    }
    return { protocolo, sequencia, versao };
  } catch {
    return null;
  }
}

export function toCvmPdfHref(link: string | null | undefined): string | null {
  const ref = parseCvmDownloadUrl(link);
  if (!ref) return link || null;
  return `/api/cvm-pdf?p=${ref.protocolo}&s=${ref.sequencia}&v=${ref.versao}`;
}

export function cvmUpstreamUrl(
  host: "ENET" | "ENETWeb",
  ref: CvmDocRef,
): string {
  const q = new URLSearchParams({
    Tela: "ext",
    descTipo: "IPE",
    CodigoInstituicao: "1",
    numProtocolo: ref.protocolo,
    numSequencia: ref.sequencia,
    numVersao: ref.versao,
  });
  return `https://www.rad.cvm.gov.br/${host}/frmDownloadDocumento.aspx?${q}`;
}

export function sniffDocument(bytes: Uint8Array): { type: string; ext: string } | null {
  let i = 0;
  while (i < bytes.length && (bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0x20)) i += 1;
  const a = bytes[i];
  const b = bytes[i + 1];
  const c = bytes[i + 2];
  const d = bytes[i + 3];
  if (a === 0x25 && b === 0x50 && c === 0x44 && d === 0x46) {
    return { type: "application/pdf", ext: "pdf" };
  }
  if (a === 0x50 && b === 0x4b) return { type: "application/zip", ext: "zip" };
  if (a === 0xd0 && b === 0xcf) return { type: "application/msword", ext: "doc" };
  return null;
}
