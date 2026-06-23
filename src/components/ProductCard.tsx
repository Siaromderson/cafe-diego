"use client";

import { useState } from "react";
import { BRL, type Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { ProductModal } from "./ProductModal";

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="uppercase tracking-widest text-cream/55">{label}</span>
      <span className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < value ? "bg-gold" : "bg-white/12"
            }`}
          />
        ))}
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);

  return (
    <article
      onClick={() => setOpen(true)}
      className="glass group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1"
    >
      <span
        className={`absolute right-5 top-5 z-10 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
          product.type === "grao"
            ? "bg-wine-bright/90 text-white"
            : "bg-gold/90 text-coffee-2"
        }`}
      >
        {product.type === "grao" ? "Em grãos" : "Moído"}
      </span>

      <div className="relative mb-5 aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-black/30 to-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
        {product.line} · {product.weight_g}g
      </p>
      <h3 className="font-display mt-1 text-2xl font-semibold text-cream">
        {product.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-cream/65">
        {product.description}
      </p>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        <Meter label="Intensidade" value={product.intensity} />
        <Meter label="Acidez" value={product.acidity} />
        <Meter label="Corpo" value={product.body} />
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-cream/50">
            a partir de
          </div>
          <div className="font-display text-3xl font-semibold gold-text">
            {BRL(product.price_cents)}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            add(product);
          }}
          className="btn-gold rounded-full px-6 py-3 text-sm uppercase tracking-wide"
        >
          Adicionar
        </button>
      </div>

      {open && (
        <ProductModal product={product} onClose={() => setOpen(false)} />
      )}
    </article>
  );
}
