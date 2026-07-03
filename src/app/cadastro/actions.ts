"use server";

import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidBrazilPhone, phoneForSubmit } from "@/lib/phone";
import { T } from "@/lib/tables";

export interface RegisterResult {
  ok: boolean;
  error?: string;
}

/**
 * Vincula pedidos anônimos (feitos sem login) ao cliente, casando pelo
 * telefone. Assim o histórico "Minhas compras" aparece mesmo para pedidos
 * feitos antes do cadastro. Usa o admin client (ignora RLS de propósito).
 */
async function linkOrdersByPhone(customerId: string, phone: string) {
  if (!phone) return;
  const sb = getSupabaseAdmin();
  await sb
    .from(T.orders)
    .update({ customer_id: customerId })
    .eq("customer_phone", phone)
    .is("customer_id", null);
}

/**
 * Cadastro de cliente com senha — cria a conta de acesso e já reivindica os
 * pedidos anteriores feitos com o mesmo WhatsApp. Depois o cliente entra em
 * "Minhas compras" (/conta) para acompanhar tudo.
 */
export async function registerCustomer(
  formData: FormData
): Promise<RegisterResult> {
  if (!hasSupabase) {
    return { ok: false, error: "Cadastro indisponível no momento." };
  }

  const name = String(formData.get("name") || "").trim();
  const phone = phoneForSubmit(String(formData.get("phone") || "").trim());
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name) return { ok: false, error: "Informe seu nome." };
  if (phone && !isValidBrazilPhone(phone)) {
    return {
      ok: false,
      error: "Telefone inválido. Digite com DDD ou só o número do WhatsApp.",
    };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (password.length < 6) {
    return {
      ok: false,
      error: "Crie uma senha com pelo menos 6 caracteres.",
    };
  }

  const sb = getSupabaseAdmin();

  // Já existe cadastro com esse e-mail? Atualiza os dados e a senha.
  const { data: existing } = await sb
    .from(T.customers)
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    await sb.from(T.customers).update({ name, phone }).eq("id", existing.id);
    // Atualiza a senha para o cliente conseguir entrar (id = auth.users.id).
    await sb.auth.admin.updateUserById(existing.id, { password });
    await linkOrdersByPhone(existing.id, phone);
    revalidatePath("/admin/clientes");
    return { ok: true };
  }

  // Novo cliente: cria o usuário com senha (gera o id) e grava o cadastro.
  try {
    const { data: created, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !created?.user?.id) {
      return {
        ok: false,
        error:
          "Esse e-mail já tem uma conta. Faça login em vez de se cadastrar.",
      };
    }
    await sb.from(T.customers).upsert({
      id: created.user.id,
      name,
      phone,
      email,
    });
    await linkOrdersByPhone(created.user.id, phone);
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
