import Image from "next/image";

type Props = {
  compact?: boolean;
};

export function LifetimeSponsor({ compact = false }: Props) {
  return (
    <a
      href="https://lftm.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 rounded-sm border border-border bg-card/60 px-3 py-1.5 text-left no-underline hover:border-[color:var(--gold)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
    >
      <Image
        src="/lifetime-logo.png"
        alt="Lifetime"
        width={1091}
        height={237}
        className="h-6 w-auto shrink-0 object-contain md:h-7"
      />
      <span
        className={`leading-snug text-muted-foreground group-hover:text-zinc-200 ${
          compact ? "font-mono text-[9px] tracking-wide uppercase" : "text-[10px]"
        }`}
      >
        Este terminal é patrocinado pela Lifetime
      </span>
    </a>
  );
}
