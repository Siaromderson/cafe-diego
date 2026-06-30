"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Atualiza o painel automaticamente quando algo muda no banco (Realtime).
 * Assina mudanças nas tabelas indicadas e dá `router.refresh()` (com um
 * pequeno debounce para não recarregar várias vezes seguidas).
 *
 * Se o Realtime não estiver ativo, simplesmente não faz nada — sem erro.
 * Ative com `supabase/enable_realtime.sql`.
 */
export function RealtimeRefresh({
  tables = ["cafe_diego_orders", "cafe_diego_products", "cafe_diego_settings"],
}: {
  tables?: string[];
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    const channel = sb.channel("admin-realtime");
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        refresh
      );
    }
    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")]);

  return null;
}
