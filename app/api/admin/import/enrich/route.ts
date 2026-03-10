import { NextResponse } from "next/server";
import { enrichPublishedOffers } from "@/lib/store";

export async function POST(request: Request) {
  await enrichPublishedOffers({ limit: 24 });
  return NextResponse.redirect(new URL("/admin/imports?enrich=1", request.url));
}
