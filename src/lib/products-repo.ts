import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { CATALOG } from "./catalog";
import { T } from "./tables";
import type { Product } from "./types";

/**
 * Lê os produtos do Supabase quando configurado; senão usa o catálogo estático.
 * Permite desenvolver/rodar a loja antes do banco estar ligado.
 */
export async function getProducts(): Promise<Product[]> {
  if (!hasSupabase) return CATALOG.filter((p) => p.active);

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from(T.products)
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true });

  if (error || !data || data.length === 0) {
    return CATALOG.filter((p) => p.active);
  }
  return data as Product[];
}

export async function getProductsById(
  ids: string[]
): Promise<Map<string, Product>> {
  const all = await getProducts();
  return new Map(all.filter((p) => ids.includes(p.id)).map((p) => [p.id, p]));
}
