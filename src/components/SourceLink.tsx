export function SourceLink({
  href,
  children,
  className = "text-sm font-medium text-zinc-100 underline-offset-2 hover:text-[color:var(--gold)] hover:underline",
  type,
}: {
  href: string | null | undefined;
  children: React.ReactNode;
  className?: string;
  type?: string;
}) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} type={type}>
      {children}
    </a>
  );
}
