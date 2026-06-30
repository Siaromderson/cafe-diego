"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth";
import { T } from "@/lib/tables";

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
    intensity: Number(formData.get("intensity") || 3),
    acidity: Number(formData.get("acidity") || 3),
    body: Number(formData.get("body") || 3),
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

export async function saveSetting(key: string, value: string) {
  const sb = await guard();
  await sb.from(T.settings).upsert({ key, value });
  revalidatePath("/admin/config");
  revalidatePath("/admin/conteudo");
  revalidatePath("/"); // textos/contatos aparecem na loja
}
