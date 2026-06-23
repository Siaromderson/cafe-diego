import { NextResponse } from "next/server";
import { getShippingConfig } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getShippingConfig();
  return NextResponse.json(config);
}
