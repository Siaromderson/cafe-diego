"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/app/admin/actions";

/**
 * Liga/desliga uma configuração booleana ("on"/"off") salvando na hora.
 * Usado, por ex., para ativar/desativar formas de pagamento no checkout.
 */
export function ToggleField({
  settingKey,
  label,
  hint,
  value,
}: {
  settingKey: string;
  label: string;
  hint?: string;
  value: string;
}) {
  const [on, setOn] = useState(String(value ?? "on").toLowerCase() !== "off");
  const [pending, start] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    start(() => saveSetting(settingKey, next ? "on" : "off"));
  };

  return (
    <div className="glass flex items-center justify-between gap-4 rounded-2xl p-5">
      <div>
        <p className="font-medium text-cream">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-cream/45">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={pending}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          on ? "bg-gold/80" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-coffee-2 shadow transition-all ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
