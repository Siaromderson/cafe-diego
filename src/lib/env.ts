export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  nupayBase: process.env.NUPAY_BASE_URL ?? "https://sandbox-api.spinpay.com.br",
  nupayKey: process.env.NUPAY_MERCHANT_KEY ?? "",
  nupayToken: process.env.NUPAY_MERCHANT_TOKEN ?? "",
  mpBase: process.env.MERCADOPAGO_BASE_URL ?? "https://api.mercadopago.com",
  mpAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  // Aceita as duas formas: `MERCADOPAGO_PUBLIC_KEY` (lida em runtime, sem a
  // pegadinha de build do prefixo NEXT_PUBLIC_) ou `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`.
  mpPublicKey:
    process.env.MERCADOPAGO_PUBLIC_KEY ??
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ??
    "",
  mpWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
  // UAZAPI (envio de WhatsApp). uazapiUrl = host da sua instância; uazapiToken
  // = token da instância. uazapiNotify = número que recebe o aviso de venda
  // (opcional; se vazio, usa o WhatsApp da loja configurado no admin).
  uazapiUrl: (process.env.UAZAPI_URL ?? "").replace(/\/+$/, ""),
  uazapiToken: process.env.UAZAPI_TOKEN ?? "",
  uazapiNotify: process.env.UAZAPI_NOTIFY_NUMBER ?? "",
  // Correios (CWS — api.correios.com.br). Cálculo de frete (preço/prazo) e
  // rastreamento. Exige contrato + cartão de postagem. Sem essas chaves a loja
  // continua com o frete fixo definido no painel.
  correiosBase: (process.env.CORREIOS_BASE_URL ?? "https://api.correios.com.br").replace(/\/+$/, ""),
  correiosUser: process.env.CORREIOS_USER ?? "",
  // Código de acesso à API (gerado no "Meu Correios" → "Gerar Código de Acesso").
  correiosAccessCode: process.env.CORREIOS_ACCESS_CODE ?? "",
  correiosCartaoPostagem: process.env.CORREIOS_CARTAO_POSTAGEM ?? "",
  correiosContrato: process.env.CORREIOS_CONTRATO ?? "",
  // CEP de onde os pedidos são postados (origem do frete). Só números.
  correiosCepOrigem: (process.env.CORREIOS_CEP_ORIGEM ?? "").replace(/\D/g, ""),
  // Códigos de serviço (variam por contrato). Padrões "à vista" mais comuns.
  correiosSedexCode: process.env.CORREIOS_SEDEX_CODE ?? "03220",
  correiosPacCode: process.env.CORREIOS_PAC_CODE ?? "03298",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
/** Envio de WhatsApp via UAZAPI só liga quando host e token estão presentes. */
export const hasUazapi = Boolean(env.uazapiUrl && env.uazapiToken);
/**
 * Integração com os Correios (frete calculado + rastreio). Só liga com as
 * credenciais e o CEP de origem preenchidos; senão a loja usa o frete fixo.
 */
export const hasCorreios = Boolean(
  env.correiosUser &&
    env.correiosAccessCode &&
    env.correiosCartaoPostagem &&
    env.correiosCepOrigem
);
