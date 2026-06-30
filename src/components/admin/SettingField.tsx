"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/app/admin/actions";

export function SettingField({
  settingKey,
  label,
  value,
  hint,
  multiline = false,
  options,
}: {
  settingKey: string;
  label: string;
  value: string;
  hint?: string;
  multiline?: boolean;
  /** Quando definido, vira um seletor (em vez de campo de texto). */
  options?: { value: string; label: string }[];
}) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const onChange = (val: string) => {
    setV(val);
    setSaved(false);
  };

  const save = () =>
    start(async () => {
      await saveSetting(settingKey, v);
      setSaved(true);
    });

  const fieldClass =
    "w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-gold/60";

  return (
    <div className="glass rounded-2xl p-5">
      <label className="text-xs uppercase tracking-widest text-cream/55">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-cream/40">{hint}</p>}
      {options ? (
        <div className="mt-2 flex gap-2">
          <select
            value={v}
            onChange={(e) => onChange(e.target.value)}
            className={`${fieldClass} appearance-none`}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value} className="bg-coffee-2">
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={save}
            disabled={pending}
            className="btn-gold rounded-lg px-4 py-2 text-sm disabled:opacity-60"
          >
            {pending ? "…" : saved ? "✓" : "Salvar"}
          </button>
        </div>
      ) : multiline ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={v}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={`${fieldClass} resize-y leading-relaxed`}
          />
          <button
            onClick={save}
            disabled={pending}
            className="btn-gold w-full rounded-lg px-4 py-2 text-sm disabled:opacity-60"
          >
            {pending ? "Salvando…" : saved ? "✓ Salvo" : "Salvar"}
          </button>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <input
            value={v}
            onChange={(e) => onChange(e.target.value)}
            className={fieldClass}
          />
          <button
            onClick={save}
            disabled={pending}
            className="btn-gold rounded-lg px-4 py-2 text-sm disabled:opacity-60"
          >
            {pending ? "…" : saved ? "✓" : "Salvar"}
          </button>
        </div>
      )}
    </div>
  );
}
