import { NextRequest, NextResponse } from "next/server";
import { env, hasMercadoPago } from "@/lib/env";
import { processMercadoPagoPayment } from "@/lib/mercadopago";

function resolveBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`.replace(/\/+$/, "");
  }
  return env.siteUrl.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  if (!hasMercadoPago) {
    return NextResponse.json(
      { error: "Pagamento não configurado." },
      { status: 503 }
    );
  }

  let body: { formData?: Record<string, unknown>; referenceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { formData, referenceId } = body;
  if (!formData || typeof formData !== "object") {
    return NextResponse.json(
      { error: "Dados do pagamento ausentes." },
      { status: 400 }
    );
  }
  if (!referenceId || typeof referenceId !== "string") {
    return NextResponse.json(
      { error: "Referência do pedido ausente." },
      { status: 400 }
    );
  }

  try {
    const payment = await processMercadoPagoPayment({
      formData,
      referenceId,
      baseUrl: resolveBaseUrl(req),
    });
    return NextResponse.json({
      id: payment.id,
      status: payment.status,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Falha ao processar o pagamento.",
      },
      { status: 502 }
    );
  }
}
