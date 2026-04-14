import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      databaseConfigured: isDatabaseConfigured()
    }
  });
}
