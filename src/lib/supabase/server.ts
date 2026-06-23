import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

/** Cliente ligado à sessão do usuário (respeita RLS). */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // chamado de um Server Component — ignorável
        }
      },
    },
  });
}

/** Cliente com service role — bypassa RLS. Use só no backend (rotas/webhooks). */
export function getSupabaseAdmin() {
  return createClient(env.supabaseUrl, env.supabaseService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
