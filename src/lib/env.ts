export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  nupayBase: process.env.NUPAY_BASE_URL ?? "https://sandbox-api.spinpay.com.br",
  nupayKey: process.env.NUPAY_MERCHANT_KEY ?? "",
  nupayToken: process.env.NUPAY_MERCHANT_TOKEN ?? "",
  mpBase: process.env.MERCADOPAGO_BASE_URL ?? "https://api.mercadopago.com",
  mpAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  mpWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
  // UAZAPI (envio de WhatsApp). uazapiUrl = host da sua instância; uazapiToken
  // = token da instância. uazapiNotify = número que recebe o aviso de venda
  // (opcional; se vazio, usa o WhatsApp da loja configurado no admin).
  uazapiUrl: (process.env.UAZAPI_URL ?? "").replace(/\/+$/, ""),
  uazapiToken: process.env.UAZAPI_TOKEN ?? "",
  uazapiNotify: process.env.UAZAPI_NOTIFY_NUMBER ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** A loja funciona sem Supabase usando o catálogo estático até as chaves entrarem. */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnon);
export const hasNupay = Boolean(env.nupayKey && env.nupayToken);
/** Quando o Access Token do Mercado Pago existe, o checkout usa pagamento real. */
export const hasMercadoPago = Boolean(env.mpAccessToken);
/** Envio de WhatsApp via UAZAPI só liga quando host e token estão presentes. */
export const hasUazapi = Boolean(env.uazapiUrl && env.uazapiToken);
