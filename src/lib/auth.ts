import { getSupabaseServer } from "./supabase/server";
import { T } from "./tables";

export async function getCurrentUser() {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

/** Verifica admin via tabela `admins` (mesma lógica da função SQL is_admin). */
export async function getIsAdmin(): Promise<boolean> {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return false;
  const { data } = await sb
    .from(T.admins)
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  return Boolean(data);
}
