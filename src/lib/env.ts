export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  nupayBase: process.env.NUPAY_BASE_URL ?? "https://sandbox-api.spinpay.com.br",
  nupayKey: process.env.NUPAY_MERCHANT_KEY ?? "",
  nupayToken: process.env.NUPAY_MERCHANT_TOKEN ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** A loja funciona sem Supabase usando o catálogo estático até as chaves entrarem. */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnon);
export const hasNupay = Boolean(env.nupayKey && env.nupayToken);
