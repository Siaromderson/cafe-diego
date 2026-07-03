"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      await supabaseBrowser().auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-cream/60 transition-colors hover:text-gold"
    >
      Sair
    </button>
  );
}
