import { NextRequest, NextResponse } from "next/server";
import { hasCorreios } from "@/lib/env";
import { trackObject } from "@/lib/correios";

export const dynamic = "force-dynamic";

/**
 * Rastreamento de um objeto dos Correios.
 * GET /api/rastreio?code=AA123456789BR
 */
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Informe o código." }, { status: 400 });
  }
  if (!hasCorreios) {
    return NextResponse.json(
      { error: "Rastreio indisponível: Correios não configurado." },
      { status: 503 }
    );
  }

  const result = await trackObject(code);
  if (!result) {
    return NextResponse.json(
      { error: "Código inválido ou sem informações no momento." },
      { status: 404 }
    );
  }
  return NextResponse.json(result);
}
