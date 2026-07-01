import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { T } from "@/lib/tables";

// Registra um acesso ao site. Chamado pelo componente <PageView> no carregamento.
export async function POST(req: Request) {
  if (!hasSupabase) return NextResponse.json({ ok: false });
  try {
    const body = (await req.json().catch(() => ({}))) as { path?: unknown };
    const path =
      typeof body.path === "string" && body.path ? body.path.slice(0, 200) : "/";
    // Não contabiliza acessos ao próprio painel administrativo.
    if (!path.startsWith("/admin")) {
      await getSupabaseAdmin().from(T.pageViews).insert({ path });
    }
  } catch {
    // Nunca quebra a navegação por causa da métrica.
  }
  return NextResponse.json({ ok: true });
}
