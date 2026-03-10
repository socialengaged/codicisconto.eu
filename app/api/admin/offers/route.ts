import { NextResponse } from "next/server";
import { createManualOffer } from "@/lib/store";
import type { OfferStatus } from "@/lib/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const categoryEntries = formData.getAll("categoryIds").map((value) => String(value)).filter(Boolean);

  await createManualOffer({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    merchantId: String(formData.get("merchantId") || ""),
    valueLabel: String(formData.get("valueLabel") || ""),
    destinationUrl: String(formData.get("destinationUrl") || ""),
    code: String(formData.get("code") || ""),
    type: (String(formData.get("type") || "coupon") as "coupon" | "deal"),
    categoryIds: categoryEntries,
    status: String(formData.get("status") || "review") as OfferStatus,
    expiresAt: String(formData.get("expiresAt") || "")
  });

  return NextResponse.redirect(new URL("/admin/offers?saved=1", request.url));
}
