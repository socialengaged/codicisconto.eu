import crypto from "crypto";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(value?: string): string {
  if (!value) {
    return "Senza scadenza";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function hashString(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function buildId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export function sortByDateDesc<T>(items: T[], getDate: (item: T) => string): T[] {
  return [...items].sort((left, right) => new Date(getDate(right)).getTime() - new Date(getDate(left)).getTime());
}
