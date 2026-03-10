import { NextResponse } from "next/server";
import { runImportPipeline } from "@/lib/import/run-import";

export async function POST(request: Request) {
  const formData = await request.formData();
  const sourceId = String(formData.get("sourceId") || "");
  await runImportPipeline(sourceId || undefined);
  return NextResponse.redirect(new URL("/admin/imports?ran=1", request.url));
}
