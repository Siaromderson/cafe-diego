"use client";

import { useEffect } from "react";

/** Registra um acesso ao site no carregamento da página (métrica do painel). */
export function PageView() {
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return; // painel não conta como acesso
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
