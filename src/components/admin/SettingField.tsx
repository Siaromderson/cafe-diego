"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/app/admin/actions";

export function SettingField({
  settingKey,
  label,
  value,
  hint,
}: {
  settingKey: string;
  label: string;
  value: string;
  hint?: string;
}) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="glass rounded-2xl p-5">
      <label className="text-xs uppercase tracking-widest text-cream/55">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-cream/40">{hint}</p>}
      <div className="mt-2 flex gap-2">
        <input
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-gold/60"
        />
        <button
          onClick={() =>
            start(async () => {
              await saveSetting(settingKey, v);
              setSaved(true);
            })
          }
          disabled={pending}
          className="btn-gold rounded-lg px-4 py-2 text-sm disabled:opacity-60"
        >
          {pending ? "…" : saved ? "✓" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
