export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  nupayBase: process.env.NUPAY_BASE_URL ?? "https://sandbox-api.spinpay.com.br",
  nupayKey: process.env.NUPAY_MERCHANT_KEY ?? "",
  nupayToken: process.env.NUPAY_MERCHANT_TOKEN ?? "",
  mpBase: process.env.MERCADOPAGO_BASE_URL ?? "https://api.mercadopago.com",
  mpAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  mpPublicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "",
  mpWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappCloudToken: process.env.WHATSAPP_CLOUD_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappWebhookUrl: process.env.WHATSAPP_WEBHOOK_URL ?? "",
  whatsappWebhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN ?? "",
  /** Destino do aviso; se vazio, usa o WhatsApp das configurações da loja. */
  whatsappNotifyTo: process.env.WHATSAPP_NOTIFY_TO ?? "",
};

/** A loja funciona sem Supabase usando o catálogo estático até as chaves entrarem. */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnon);
export const hasNupay = Boolean(env.nupayKey && env.nupayToken);
/** Quando o Access Token do Mercado Pago existe, o checkout usa pagamento real. */
export const hasMercadoPago = Boolean(env.mpAccessToken);
/** Pagamento embutido (Brick) exige também a chave pública. */
export const hasMercadoPagoEmbedded = Boolean(
  env.mpAccessToken && env.mpPublicKey
);
/** Aviso automático de pedido no WhatsApp (Cloud API ou webhook). */
export const hasWhatsAppNotify = Boolean(
  (env.whatsappCloudToken && env.whatsappPhoneNumberId) ||
    env.whatsappWebhookUrl
);
