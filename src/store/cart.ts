"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "@/lib/types";

interface CartState {
  lines: CartLine[];
  open: boolean;
  add: (product: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  count: () => number;
  total: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      add: (product, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.product.id === product.id);
          if (existing) {
            return {
              open: true,
              lines: s.lines.map((l) =>
                l.product.id === product.id
                  ? { ...l, qty: l.qty + qty }
                  : l
              ),
            };
          }
          return { open: true, lines: [...s.lines, { product, qty }] };
        }),
      remove: (id) =>
        set((s) => ({ lines: s.lines.filter((l) => l.product.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.product.id === id ? { ...l, qty } : l))
            .filter((l) => l.qty > 0),
        })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
      total: () =>
        get().lines.reduce((n, l) => n + l.qty * l.product.price_cents, 0),
    }),
    { name: "cafe-feirante-cart" }
  )
);
