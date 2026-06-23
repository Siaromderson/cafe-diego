"use client";

import Link from "next/link";
import { BRL } from "@/lib/types";
import { useCart } from "@/store/cart";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total } = useCart();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`glass-strong fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col transition-transform duration-400 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="font-display text-2xl font-semibold text-cream">
            Seu carrinho
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-cream/60 transition-colors hover:text-gold"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-cream/50">
              <p className="font-display text-xl">Seu carrinho está vazio</p>
              <p className="mt-1 text-sm">Que tal um café fresquinho?</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((l) => (
                <li
                  key={l.product.id}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.product.image_url}
                    alt={l.product.name}
                    className="h-20 w-16 rounded-lg object-contain"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-cream">
                        {l.product.name}
                      </p>
                      <button
                        onClick={() => remove(l.product.id)}
                        className="text-xs text-cream/40 hover:text-wine-bright"
                      >
                        remover
                      </button>
                    </div>
                    <p className="text-xs text-cream/50">
                      {l.product.weight_g}g ·{" "}
                      {l.product.type === "grao" ? "em grãos" : "moído"}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-white/15 px-1">
                        <button
                          onClick={() => setQty(l.product.id, l.qty - 1)}
                          className="h-7 w-7 text-gold"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm">{l.qty}</span>
                        <button
                          onClick={() => setQty(l.product.id, l.qty + 1)}
                          className="h-7 w-7 text-gold"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display text-lg font-semibold gold-text">
                        {BRL(l.product.price_cents * l.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5">
            <div className="mb-1 flex items-center justify-between text-sm text-cream/70">
              <span>Frete (Campo Grande)</span>
              <span className="text-gold">Grátis</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-cream/70">Total</span>
              <span className="font-display text-2xl font-semibold gold-text">
                {BRL(total())}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="btn-gold block rounded-full py-3.5 text-center text-sm uppercase tracking-wide"
            >
              Finalizar compra
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
