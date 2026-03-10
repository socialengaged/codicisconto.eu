import type { OfferView } from "@/lib/types";

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\s+([,.!?:;])/g, "$1").trim();
}

function extractProductTitleFromDescription(description?: string): string | undefined {
  if (!description) {
    return undefined;
  }

  const normalized = cleanWhitespace(description);
  const viaArrow = normalized.match(/^(.{8,140}?)\s*👉/)?.[1]?.trim();
  if (viaArrow) {
    return viaArrow.replace(/^•\s*/, "").trim();
  }

  const viaPrice = normalized.match(/^•?\s*(.{8,140}?)\s*💰/)?.[1]?.trim();
  return viaPrice?.trim();
}

function isPromoShoutTitle(title: string): boolean {
  return /^(sconto|prezzone|super prezzo|minimo|ribasso|selezione|bomba)/i.test(title) || title === title.toUpperCase();
}

export function getOfferDisplayTitle(offer: Pick<OfferView, "title" | "code" | "description">): string {
  if (offer.code) {
    return offer.title;
  }

  const cleanedTitle = cleanWhitespace(
    offer.title
      .replace(/\bcon il coupon\s+([A-Za-z0-9'_-]+)/gi, "su $1")
      .replace(/\bcol coupon\s+([A-Za-z0-9'_-]+)/gi, "su $1")
      .replace(/\bcon il\s+([A-Z0-9'_-]{4,})\b/g, "su $1")
      .replace(/\bCodice sconto\b/gi, "")
      .replace(/\bCodice promo\b/gi, "")
      .replace(/\bCodice promozionale\b/gi, "")
      .replace(/\bCoupon\b/gi, "")
  );

  if (isPromoShoutTitle(cleanedTitle)) {
    return extractProductTitleFromDescription(offer.description) || cleanedTitle;
  }

  return cleanedTitle;
}

export function getOfferDisplayDescription(offer: Pick<OfferView, "title" | "description" | "code" | "merchant" | "valueLabel">): string {
  if (offer.code) {
    return offer.description;
  }

  const cleaned = cleanWhitespace(
    offer.description
      .replace(/\bcon il coupon\s+([A-Za-z0-9'_-]+)/gi, "su $1")
      .replace(/\bcol coupon\s+([A-Za-z0-9'_-]+)/gi, "su $1")
      .replace(/\bcon il\s+([A-Z0-9'_-]{4,})\b/g, "su $1")
      .replace(/\bCodice sconto\b/gi, "Promozione")
      .replace(/\bCodice promo\b/gi, "Promozione")
      .replace(/\bCodice promozionale\b/gi, "Promozione")
      .replace(/\bCoupon\b/gi, "Promozione")
  );

  if (cleaned && cleaned.toLowerCase() !== offer.title.toLowerCase()) {
    return cleaned;
  }

  return `Promozione attiva monitorata per ${offer.merchant.name} con vantaggio segnalato ${offer.valueLabel}.`;
}
