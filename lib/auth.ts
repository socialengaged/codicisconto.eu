import crypto from "crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-cookie";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "local-dev-secret";
}

function signValue(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createAdminCookieValue(username: string): string {
  const payload = `${username}:${Date.now()}`;
  return `${payload}.${signValue(payload)}`;
}

export function isValidAdminCookie(cookieValue?: string): boolean {
  if (!cookieValue || !cookieValue.includes(".")) {
    return false;
  }

  const [payload, signature] = cookieValue.split(".");
  return signValue(payload) === signature;
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE_NAME;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminCookie(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
