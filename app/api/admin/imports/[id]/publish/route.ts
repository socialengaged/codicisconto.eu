import { NextResponse } from "next/server";
import { publishImportedOffer } from "@/lib/store";

interface PublishImportRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: PublishImportRouteProps) {
  const { id } = await params;
  await publishImportedOffer(id);
  return NextResponse.redirect(new URL("/admin/imports?published=1", request.url));
}
