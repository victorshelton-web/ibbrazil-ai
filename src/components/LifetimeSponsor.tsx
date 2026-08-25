import Image from "next/image";

export function LifetimeSponsor() {
  return (
    <a
      href="https://lftm.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex max-w-full items-center gap-2 rounded-sm border border-border bg-card/60 px-3 py-1.5 no-underline hover:border-[color:var(--gold)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
    >
      <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase group-hover:text-zinc-200">
        Este terminal é patrocinado pela
      </span>
      <Image
        src="/lifetime-logo.png"
        alt="Lifetime"
        width={1091}
        height={237}
        className="h-6 w-auto shrink-0 object-contain md:h-7"
      />
    </a>
  );
}
