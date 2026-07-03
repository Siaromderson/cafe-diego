import { NextResponse } from "next/server";
import {
  env,
  hasMercadoPago,
  hasMercadoPagoEmbedded,
} from "@/lib/env";

/**
 * Diagnóstico do pagamento — informa (sem expor segredos) se o servidor
 * está enxergando as credenciais do Mercado Pago. Útil para confirmar, após
 * um deploy, se o pagamento embutido (sem redirecionamento) está ativo.
 *
 * Abra `/api/payments/status` no navegador.
 */
export const dynamic = "force-dynamic";

function mask(v: string): string | null {
  if (!v) return null;
  const clean = v.trim();
  if (clean.length <= 8) return `${clean.slice(0, 2)}…`;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

export function GET() {
  const accessToken = env.mpAccessToken;
  const publicKey = env.mpPublicKey;

  return NextResponse.json({
    // Pagamento embutido ativo? (precisa dos dois: token + chave pública)
    pagamentoEmbutidoAtivo: hasMercadoPagoEmbedded,
    redirecionaParaMercadoPago: hasMercadoPago && !hasMercadoPagoEmbedded,

    accessTokenPresente: Boolean(accessToken),
    chavePublicaPresente: Boolean(publicKey),

    // Prévia mascarada só para conferir que é a credencial certa.
    accessTokenPrefixo: mask(accessToken),
    chavePublicaPrefixo: mask(publicKey),

    dica: !publicKey
      ? "Defina MERCADOPAGO_PUBLIC_KEY na Vercel e faça um NOVO deploy (Redeploy)."
      : !accessToken
        ? "Defina MERCADOPAGO_ACCESS_TOKEN na Vercel e faça um novo deploy."
        : "Tudo certo — o pagamento acontece na própria página, sem redirecionar.",
  });
}
