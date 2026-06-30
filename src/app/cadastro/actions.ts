"use server";

import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidBrazilPhone } from "@/lib/phone";
import { T } from "@/lib/tables";

export interface RegisterResult {
  ok: boolean;
  error?: string;
}

/**
 * Cadastro público de cliente (campanha do Insta → site).
 * Cria/atualiza o cliente e ele aparece direto na aba "Clientes" do painel,
 * mesmo sem ter feito nenhum pedido ainda.
 */
export async function registerCustomer(
  formData: FormData
): Promise<RegisterResult> {
  if (!hasSupabase) {
    return { ok: false, error: "Cadastro indisponível no momento." };
  }

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!name) return { ok: false, error: "Informe seu nome." };
  if (phone && !isValidBrazilPhone(phone)) {
    return { ok: false, error: "Telefone inválido. Use DDD + número." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Informe um e-mail válido." };
  }

  const sb = getSupabaseAdmin();

  // Já existe cadastro com esse e-mail? Atualiza os dados e pronto.
  const { data: existing } = await sb
    .from(T.customers)
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    await sb
      .from(T.customers)
      .update({ name, phone })
      .eq("id", existing.id);
    revalidatePath("/admin/clientes");
    return { ok: true };
  }

  // Novo cliente: cria o usuário (gera o id) e grava o cadastro.
  try {
    const { data: created, error } = await sb.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !created?.user?.id) {
      // e-mail provavelmente já tem login mas sem linha em clientes — grava assim mesmo
      throw error ?? new Error("sem id");
    }
    await sb.from(T.customers).upsert({
      id: created.user.id,
      name,
      phone,
      email,
    });
    revalidatePath("/admin/clientes");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Não foi possível concluir o cadastro. Esse e-mail pode já estar em uso.",
    };
  }
}
