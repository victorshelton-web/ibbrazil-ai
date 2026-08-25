"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshTape() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="h-8 rounded-sm border border-[color:var(--gold)]/40 px-3 font-mono text-[11px] text-[color:var(--gold)] hover:bg-[color:var(--gold)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
    >
      {pending ? "Refreshing…" : "Refresh tape"}
    </button>
  );
}
