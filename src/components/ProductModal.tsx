"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BRL, productImages, type Product } from "@/lib/types";
import { useCart } from "@/store/cart";

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

export function ProductModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const images = productImages(product);
  const [active, setActive] = useState(0);

  const go = (dir: number) =>
    setActive((i) => (i + dir + images.length) % images.length);

  // fecha no ESC + navega com as setas, e trava o scroll do fundo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="glass relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-2xl leading-none text-cream hover:bg-black/60"
        >
          ×
        </button>

        <div className="grid gap-7 sm:grid-cols-2">
          {/* Galeria */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-black/30 to-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[active]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl text-cream hover:bg-black/70"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Próxima foto"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl text-cream hover:bg-black/70"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActive(i)}
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border transition ${
                      i === active
                        ? "border-gold"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex flex-col">
            <span
              className={`mb-3 inline-flex w-fit rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
                product.type === "grao"
                  ? "bg-wine-bright/90 text-white"
                  : "bg-gold/90 text-coffee-2"
              }`}
            >
              {product.type === "grao" ? "Em grãos" : "Moído"}
            </span>

            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
              {product.line} · {product.weight_g}g
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-cream">
              {product.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              {product.description}
            </p>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-5">
              <Meter label="Intensidade" value={product.intensity} />
              <Meter label="Acidez" value={product.acidity} />
              <Meter label="Corpo" value={product.body} />
            </div>

            <div className="mt-auto flex items-end justify-between pt-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-cream/50">
                  a partir de
                </div>
                <div className="font-display text-3xl font-semibold gold-text">
                  {BRL(product.price_cents)}
                </div>
              </div>
              <button
                onClick={() => {
                  add(product);
                  onClose();
                }}
                className="btn-gold rounded-full px-6 py-3 text-sm uppercase tracking-wide"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
