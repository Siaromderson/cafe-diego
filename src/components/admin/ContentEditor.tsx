"use client";

import { useMemo, useState, useTransition } from "react";
import { saveSetting } from "@/app/admin/actions";
import {
  CONTENT_GROUPS,
  contentFromValues,
  type ContentFieldDef,
} from "@/lib/content-data";
import { SitePreview } from "./SitePreview";

/**
 * Editor de conteúdo com prévia ao vivo.
 * O estado dos textos fica aqui; ao digitar, a miniatura do site
 * (`SitePreview`) atualiza na hora. Cada campo salva no banco ao clicar
 * em "Salvar". No desktop a prévia fica fixa ao lado; no celular, fixa
 * embaixo (recolhível).
 */
export function ContentEditor({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const content = useMemo(() => contentFromValues(values), [values]);
  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
      {/* Campos (espaço no rodapé p/ a barra de prévia fixa no celular) */}
      <div className="space-y-8 pb-20 lg:pb-2">
        {CONTENT_GROUPS.map((group) => (
          <section key={group.title} className="space-y-4">
            <h2 className="font-display text-xl text-gold">{group.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((f) => (
                <Field
                  key={f.key}
                  def={f}
                  value={values[f.key] ?? ""}
                  onChange={(v) => setValue(f.key, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Prévia — barra fixa no rodapé (celular) / painel fixo ao lado (desktop) */}
      <aside
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:sticky lg:inset-x-auto lg:bottom-auto lg:top-6 lg:z-auto lg:px-0 lg:pb-0"
      >
        <SitePreview content={content} />
      </aside>
    </div>
  );
}

function Field({
  def,
  value,
  onChange,
}: {
  def: ContentFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () =>
    start(async () => {
      await saveSetting(def.key, value);
      setSaved(true);
    });

  const handle = (v: string) => {
    onChange(v);
    setSaved(false);
  };

  const fieldClass =
    "w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-gold/60";
  const isMultiline = def.kind === "multiline";

  return (
    <div className={`glass rounded-2xl p-5 ${isMultiline ? "sm:col-span-2" : ""}`}>
      <label className="text-xs uppercase tracking-widest text-cream/55">
        {def.label}
      </label>
      {def.hint && <p className="mt-1 text-xs text-cream/40">{def.hint}</p>}

      {def.kind === "select" ? (
        <div className="mt-2 flex gap-2">
          <select
            value={value}
            onChange={(e) => handle(e.target.value)}
            className={`${fieldClass} appearance-none`}
          >
            {def.options?.map((o) => (
              <option key={o.value} value={o.value} className="bg-coffee-2">
                {o.label}
              </option>
            ))}
          </select>
          <SaveBtn pending={pending} saved={saved} onClick={save} />
        </div>
      ) : isMultiline ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={value}
            onChange={(e) => handle(e.target.value)}
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
            value={value}
            onChange={(e) => handle(e.target.value)}
            className={fieldClass}
          />
          <SaveBtn pending={pending} saved={saved} onClick={save} />
        </div>
      )}
    </div>
  );
}

function SaveBtn({
  pending,
  saved,
  onClick,
}: {
  pending: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="btn-gold rounded-lg px-4 py-2 text-sm disabled:opacity-60"
    >
      {pending ? "…" : saved ? "✓" : "Salvar"}
    </button>
  );
}
