"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth";
import { T } from "@/lib/tables";
import { hasUazapi } from "@/lib/env";
import { sendTestToStore } from "@/lib/whatsapp";
import { whatsappDisplay } from "@/lib/content-data";

const BUCKET = "produtos";

async function guard() {
  if (!(await getIsAdmin())) throw new Error("Não autorizado");
  return getSupabaseServer();
}

/** Sobe um arquivo para o Storage e devolve a URL pública (ou null). */
async function uploadImage(file: File | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const sb = getSupabaseAdmin();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) {
    console.error("[upload] falha ao subir imagem:", error.message);
    return null;
  }
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function setOrderStatus(id: string, status: string) {
  const sb = await guard();
  const patch: Record<string, unknown> = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
  await sb.from(T.orders).update(patch).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/entregues");
  revalidatePath("/admin/clientes");
}

/** Marca um pedido como cancelado (sai da lista de ativos, mas fica no histórico). */
export async function cancelOrder(id: string) {
  return setOrderStatus(id, "canceled");
}

/** Apaga um pedido em definitivo (itens + pedido). */
export async function deleteOrder(id: string) {
  const sb = await guard();
  await sb.from(T.orderItems).delete().eq("order_id", id);
  await sb.from(T.orders).delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/entregues");
  revalidatePath("/admin/clientes");
}

/** Apaga TODOS os pedidos (itens + pedidos). Não mexe nos cadastros de clientes. */
export async function clearAllOrders() {
  const sb = await guard();
  // Apaga todos os itens e depois todos os pedidos. O filtro "not null" no id
  // garante que a operação atinge todas as linhas.
  await sb.from(T.orderItems).delete().not("id", "is", null);
  await sb.from(T.orders).delete().not("id", "is", null);
  revalidatePath("/admin");
  revalidatePath("/admin/entregues");
  revalidatePath("/admin/clientes");
}

export async function saveProduct(formData: FormData) {
  const sb = await guard();
  const id = formData.get("id") as string | null;

  // ---- Imagens: upload direto de arquivos (Storage) ----
  const uploadedMain = await uploadImage(formData.get("image_file") as File);
  const image_url =
    uploadedMain || String(formData.get("image_url") || "").trim();

  const extraFiles = (formData.getAll("image_files") as File[]).filter(
    (f) => f && typeof f !== "string" && f.size > 0
  );
  const uploadedExtras: string[] = [];
  for (const f of extraFiles) {
    const u = await uploadImage(f);
    if (u) uploadedExtras.push(u);
  }
  const keptImages = String(formData.get("images_existing") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const images = [...keptImages, ...uploadedExtras];

  const row = {
    slug: String(formData.get("slug") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    line: String(formData.get("line") || ""),
    type: String(formData.get("type") || "grao"),
    weight_g: Number(formData.get("weight_g") || 0),
    price_cents: Math.round(Number(formData.get("price_reais") || 0) * 100),
    description: String(formData.get("description") || ""),
    body: Number(formData.get("body") || 3),
    sweetness: Number(formData.get("sweetness") || 3),
    bitterness: Number(formData.get("bitterness") || 3),
    acidity: Number(formData.get("acidity") || 3),
    aroma: Number(formData.get("aroma") || 3),
    aftertaste: Number(formData.get("aftertaste") || 3),
    tier: String(formData.get("tier") || "superior"),
    image_url,
    images,
    stock: Number(formData.get("stock") || 0),
    active: formData.get("active") === "on",
    sort: Number(formData.get("sort") || 0),
  };
  if (id) await sb.from(T.products).update(row).eq("id", id);
  else await sb.from(T.products).insert(row);
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  const sb = await guard();
  await sb.from(T.products).delete().eq("id", id);
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

/** Sobe/desce um produto na ordem da loja, trocando o "sort" com o vizinho. */
export async function moveProduct(id: string, dir: "up" | "down") {
  const sb = await guard();
  const { data } = await sb
    .from(T.products)
    .select("id, sort")
    .order("sort", { ascending: true });
  const list = (data ?? []) as { id: string; sort: number | null }[];
  const i = list.findIndex((p) => p.id === id);
  if (i === -1) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;

  // Troca de posição e renumera todos (0..n-1) — resolve empates/sort repetido.
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(
    list.map((p, idx) =>
      p.sort === idx
        ? Promise.resolve()
        : sb.from(T.products).update({ sort: idx }).eq("id", p.id)
    )
  );
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

/**
 * Dispara uma mensagem de teste no WhatsApp da loja (botão do admin).
 * Retorna um resultado amigável para a UI mostrar sucesso/erro.
 */
export async function sendTestWhatsapp(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!(await getIsAdmin())) return { ok: false, message: "Não autorizado." };
  if (!hasUazapi) {
    return {
      ok: false,
      message:
        "UAZAPI não configurada. Defina UAZAPI_URL e UAZAPI_TOKEN no servidor e reinicie.",
    };
  }

  const r = await sendTestToStore();
  if (r.ok) {
    const dest = r.to ? ` para ${whatsappDisplay(r.to)}` : "";
    return {
      ok: true,
      message: `Mensagem de teste enviada${dest}. Confira o WhatsApp.`,
    };
  }

  const detail =
    r.error ??
    (r.raw ? JSON.stringify(r.raw).slice(0, 200) : "erro desconhecido");
  return {
    ok: false,
    message: `Falha ao enviar${
      r.status ? ` (HTTP ${r.status})` : ""
    }: ${detail}`,
  };
}

export async function saveSetting(key: string, value: string) {
  const sb = await guard();
  await sb.from(T.settings).upsert({ key, value });
  revalidatePath("/admin/config");
  revalidatePath("/admin/conteudo");
  revalidatePath("/"); // textos/contatos aparecem na loja
}
