import { NextResponse } from "next/server";
import { getShippingConfig, getPaymentMethods } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const [config, payMethods] = await Promise.all([
    getShippingConfig(),
    getPaymentMethods(),
  ]);
  return NextResponse.json({ ...config, payMethods });
}
