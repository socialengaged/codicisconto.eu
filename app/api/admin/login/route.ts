import { NextResponse } from "next/server";
import { createAdminCookieValue, getAdminCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (
    username !== (process.env.ADMIN_USERNAME || "admin") ||
    password !== (process.env.ADMIN_PASSWORD || "changeme")
  ) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set({
    name: getAdminCookieName(),
    value: createAdminCookieValue(username),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
