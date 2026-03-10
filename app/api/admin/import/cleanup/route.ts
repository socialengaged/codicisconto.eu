import { NextResponse } from "next/server";
import { cleanupImportedData } from "@/lib/store";

export async function POST(request: Request) {
  await cleanupImportedData();
  return NextResponse.redirect(new URL("/admin/imports?cleaned=1", request.url));
}
