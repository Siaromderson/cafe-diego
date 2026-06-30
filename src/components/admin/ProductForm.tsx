"use client";

import { useState, useTransition } from "react";
import { saveProduct, deleteProduct, moveProduct } from "@/app/admin/actions";
import type { Product } from "@/lib/types";

const field =
  "w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm text-cream placeholder:text-cream/35 outline-none focus:border-gold/60";
const label = "text-xs uppercase tracking-widest text-cream/55";

export function ProductForm({
  product,
  index,
  total,
}: {
  product?: Product;
  index?: number;
  total?: number;
}) {
  const [open, setOpen] = useState(!product);
  const [moving, startMove] = useTransition();
  const p = product;

  const canReorder = index != null && total != null && total > 1;
  const isFirst = index === 0;
  const isLast = index != null && total != null && index === total - 1;

  if (product && !open) {
    return (
      <div className="glass card-hover flex items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex min-w-0 items-center gap-4">
          {canReorder && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => startMove(() => moveProduct(p!.id, "up"))}
                disabled={moving || isFirst}
                aria-label="Subir"
                className="rounded-md border border-white/12 px-2 py-0.5 text-cream/60 transition-colors hover:border-gold/50 hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
              >
                ↑
              </button>
              <button
                onClick={() => startMove(() => moveProduct(p!.id, "down"))}
                disabled={moving || isLast}
                aria-label="Descer"
                className="rounded-md border border-white/12 px-2 py-0.5 text-cream/60 transition-colors hover:border-gold/50 hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
              >
                ↓
              </button>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p!.image_url}
            alt=""
            className="h-14 w-12 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-cream">{p!.name}</p>
            <p className="text-sm text-cream/55">
              {p!.weight_g}g · {(p!.price_cents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}{" "}
              · {p!.active ? "ativo" : "inativo"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="btn-ghost shrink-0 rounded-full px-4 py-2 text-sm"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      action={saveProduct}
      className="glass space-y-4 rounded-2xl p-5"
    >
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className={label}>Nome</span>
          <input name="name" defaultValue={p?.name} className={field} required />
        </div>
        <div>
          <span className={label}>Slug (URL)</span>
          <input name="slug" defaultValue={p?.slug} className={field} required />
        </div>
        <div>
          <span className={label}>Linha</span>
          <input name="line" defaultValue={p?.line} className={field} />
        </div>
        <div>
          <span className={label}>Imagem principal</span>
          <input type="hidden" name="image_url" defaultValue={p?.image_url} />
          <div className="mt-1 flex items-center gap-3">
            {p?.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_url}
                alt=""
                className="h-14 w-12 rounded-lg object-contain ring-1 ring-white/10"
              />
            )}
            <input
              name="image_file"
              type="file"
              accept="image/*"
              className="block w-full text-xs text-cream/70 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-gold hover:file:bg-gold/30"
            />
          </div>
          <p className="mt-1 text-xs text-cream/40">
            Suba uma foto do seu computador. {p ? "Deixe vazio para manter a atual." : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <span className={label}>Tipo</span>
          <select name="type" defaultValue={p?.type ?? "grao"} className={field}>
            <option value="grao">Em grãos</option>
            <option value="moido">Moído</option>
          </select>
        </div>
        <div>
          <span className={label}>Peso (g)</span>
          <input
            name="weight_g"
            type="number"
            defaultValue={p?.weight_g ?? 1000}
            className={field}
          />
        </div>
        <div>
          <span className={label}>Preço (R$)</span>
          <input
            name="price_reais"
            type="number"
            step="0.01"
            defaultValue={p ? (p.price_cents / 100).toFixed(2) : ""}
            className={field}
            required
          />
        </div>
        <div>
          <span className={label}>Estoque</span>
          <input
            name="stock"
            type="number"
            defaultValue={p?.stock ?? 999}
            className={field}
          />
        </div>
      </div>

      <div>
        <span className={label}>Fotos extras (galeria)</span>
        <input
          type="hidden"
          name="images_existing"
          defaultValue={(p?.images ?? []).join("\n")}
        />
        {(p?.images ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(p?.images ?? []).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-14 w-12 rounded-lg object-contain ring-1 ring-white/10"
              />
            ))}
          </div>
        )}
        <input
          name="image_files"
          type="file"
          accept="image/*"
          multiple
          className="mt-2 block w-full text-xs text-cream/70 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-gold hover:file:bg-gold/30"
        />
        <p className="mt-1 text-xs text-cream/40">
          Pode escolher várias de uma vez. Elas são adicionadas às fotos atuais.
        </p>
      </div>

      <div>
        <span className={label}>Descrição</span>
        <textarea
          name="description"
          defaultValue={p?.description}
          rows={2}
          className={field}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["intensity", "acidity", "body"] as const).map((k) => (
          <div key={k}>
            <span className={label}>
              {k === "intensity"
                ? "Intensidade"
                : k === "acidity"
                ? "Acidez"
                : "Corpo"}{" "}
              (1-5)
            </span>
            <input
              name={k}
              type="number"
              min={1}
              max={5}
              defaultValue={p?.[k] ?? 3}
              className={field}
            />
          </div>
        ))}
        <div>
          <span className={label}>Ordem</span>
          <input
            name="sort"
            type="number"
            defaultValue={p?.sort ?? 0}
            className={field}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-cream/80">
        <input
          name="active"
          type="checkbox"
          defaultChecked={p?.active ?? true}
          className="h-4 w-4 accent-[#d9b777]"
        />
        Produto ativo (visível na loja)
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          className="btn-gold rounded-full px-6 py-2.5 text-sm uppercase tracking-wide"
        >
          Salvar
        </button>
        {p && (
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost rounded-full px-6 py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Excluir este produto?")) deleteProduct(p.id);
              }}
              className="rounded-full px-6 py-2.5 text-sm text-wine-bright hover:underline"
            >
              Excluir
            </button>
          </>
        )}
      </div>
    </form>
  );
}
