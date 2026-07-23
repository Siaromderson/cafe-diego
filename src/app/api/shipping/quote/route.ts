import { NextResponse } from "next/server";
import { getShippingQuote } from "@/lib/shipping";
import { getProducts } from "@/lib/products-repo";
import { cartWeightGrams } from "@/lib/correios";

export const dynamic = "force-dynamic";

interface QuoteBody {
  cep?: string;
  items?: { id: string; qty: number }[];
}

/**
 * Cotação de frete para um CEP + carrinho. Calcula o peso no servidor a partir
 * do catálogo (nunca confia no peso do cliente) e devolve as opções de entrega.
 * Sem Correios configurado (ou em caso de falha), devolve as opções fixas.
 */
export async function POST(req: Request) {
  let body: QuoteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const cep = String(body.cep || "").replace(/\D/g, "");
  const items = Array.isArray(body.items) ? body.items : [];

  const catalog = await getProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines = items
    .map((i) => {
      const p = byId.get(i.id);
      if (!p) return null;
      const qty = Math.max(1, Math.min(99, Math.floor(i.qty)));
      return { weight_g: p.weight_g, qty };
    })
    .filter(Boolean) as { weight_g: number; qty: number }[];

  const weightGrams = cartWeightGrams(lines);
  const options = await getShippingQuote(cep, weightGrams);

  return NextResponse.json({ options });
}
