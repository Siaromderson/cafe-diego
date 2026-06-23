"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/admin-range";

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = (params.get("range") as RangeKey) || "month";
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function go(range: RangeKey, extra?: Record<string, string>) {
    const sp = new URLSearchParams();
    sp.set("range", range);
    if (extra?.from) sp.set("from", extra.from);
    if (extra?.to) sp.set("to", extra.to);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2.5">
      {RANGE_OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => go(o.key, o.key === "custom" ? { from, to } : undefined)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            current === o.key
              ? "btn-gold"
              : "text-cream/70 hover:bg-white/8 hover:text-gold"
          }`}
        >
          {o.label}
        </button>
      ))}

      {current === "custom" && (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold/60"
          />
          <span className="text-cream/40">até</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold/60"
          />
          <button
            onClick={() => go("custom", { from, to })}
            className="btn-ghost rounded-full px-3 py-1.5 text-xs"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
