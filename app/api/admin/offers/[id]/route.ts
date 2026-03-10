import { NextResponse } from "next/server";
import { updateOfferStatus } from "@/lib/store";
import type { OfferStatus } from "@/lib/types";

interface OfferStatusRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: OfferStatusRouteProps) {
  const { id } = await params;
  const formData = await request.formData();
  await updateOfferStatus(id, String(formData.get("status") || "review") as OfferStatus);
  return NextResponse.redirect(new URL("/admin/offers?updated=1", request.url));
}
