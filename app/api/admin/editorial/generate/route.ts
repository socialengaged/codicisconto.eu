import { NextResponse } from "next/server";
import { generateEditorialDraft } from "@/lib/editorial-ai";
import type { EditorialArticleType } from "@/lib/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const topic = String(formData.get("topic") || "").trim();
  const type = String(formData.get("type") || "news") as EditorialArticleType;
  const offerIds = formData.getAll("offerIds").map((value) => String(value)).filter(Boolean);

  if (!topic) {
    return NextResponse.redirect(new URL("/admin/editorial?error=missing-topic", request.url));
  }

  await generateEditorialDraft({
    type,
    topic,
    offerIds
  });

  return NextResponse.redirect(new URL("/admin/editorial?generated=1", request.url));
}
