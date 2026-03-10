import { guessMerchant, sanitizeCode, stripHtmlPreservingBlocks } from "@/lib/import/extract";
import { getTelegramSourcePreset } from "@/lib/import/telegram/presets";
import { inferOfficialMerchantDomain } from "@/lib/merchant-official";
import type { NormalizedImportedOffer } from "@/lib/import/types";
import type { Source } from "@/lib/types";

interface TelegramMessageBlock {
  postPath: string;
  html: string;
}

function decodeTelegramUrl(value: string): string {
  return value.replace(/&amp;/g, "&");
}

function extractMessageBlocks(html: string): TelegramMessageBlock[] {
  const matches = Array.from(
    html.matchAll(
      /<div class="tgme_widget_message[^"]*?js-widget_message"[^>]*data-post="([^"]+)"[\s\S]*?<div class="tgme_widget_message_bubble">([\s\S]*?)<div class="tgme_widget_message_footer/gi
    )
  );

  return matches.map((match) => ({
    postPath: match[1],
    html: match[2]
  }));
}

function extractMessageText(blockHtml: string): string {
  const textHtml = blockHtml.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  return stripHtmlPreservingBlocks(textHtml);
}

function extractLinks(blockHtml: string): string[] {
  return Array.from(blockHtml.matchAll(/<a [^>]*href="([^"]+)"/gi)).map((match) => decodeTelegramUrl(match[1]));
}

function extractMessagePreviewImage(blockHtml: string): string | undefined {
  const inlineMatch =
    blockHtml.match(/background-image:url\('([^']+)'\)/i)?.[1] ||
    blockHtml.match(/background-image:url\(&quot;([^&]+)&quot;\)/i)?.[1];

  return inlineMatch ? decodeTelegramUrl(inlineMatch) : undefined;
}

function cleanTelegramLine(line: string): string {
  return line
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikePromoShout(line: string): boolean {
  return /prezzo|prezzone|minimo|bomba|ribasso|selezione|super prezzo|miglior prezzo/i.test(line);
}

function extractTelegramTitle(lines: string[], hasAmazonLink: boolean): string {
  const meaningful = lines
    .map(cleanTelegramLine)
    .map((line) => {
      if (/!/.test(line)) {
        const [prefix, suffix] = line.split(/!(.+)/).filter(Boolean);
        if (prefix && suffix && looksLikePromoShout(prefix)) {
          return suffix.trim();
        }
      }
      return line;
    })
    .filter(Boolean);
  if (meaningful.length === 0) {
    return "Offerta Telegram";
  }

  if (hasAmazonLink && meaningful.length >= 2 && looksLikePromoShout(meaningful[0])) {
    return meaningful[1];
  }

  return meaningful[0];
}

function extractPromoMerchant(title: string, text: string): string | undefined {
  const fromPattern =
    title.match(/\bsu\s+([A-Z0-9][A-Z0-9&.' -]{1,40})/i)?.[1]?.trim() ||
    title.match(/\b([A-Z0-9][A-Z0-9&.' -]{1,40})$/)?.[1]?.trim();

  return guessMerchant(fromPattern || text, "");
}

function extractValueLabel(text: string): string | undefined {
  return (
    text.match(/-?\d{1,3}\s?%/)?.[0] ||
    text.match(/\d{1,4}(?:[.,]\d{1,2})?\s?(?:€|euro)/i)?.[0] ||
    undefined
  );
}

function extractExpiresAtText(text: string): string | undefined {
  return text.match(/Scadenza:\s*([^\n]+)/i)?.[1]?.trim();
}

function extractCouponCode(text: string, merchantHint: string): string | undefined {
  const explicit = text.match(/(?:codice|coupon)(?:\s+sconto|\s+promo|\s+promozionale)?[:\s-]+([A-Z0-9_-]{4,20})/i)?.[1];

  return sanitizeCode(explicit, merchantHint);
}

function isUsefulTelegramMessage(text: string): boolean {
  const normalized = text.toLowerCase();
  if (!normalized) {
    return false;
  }

  if (/whatsapp\.com\/channel|pinned a photo|segui i coupon/i.test(normalized)) {
    return false;
  }

  return /amazon|sconto|coupon|codice|prezzo|anziche|scadenza|guardalo su amazon/i.test(normalized);
}

function buildTelegramPostUrl(postPath: string): string {
  const [channel, postId] = postPath.split("/");
  return `https://t.me/${channel}/${postId}`;
}

function extractBulletOfferLine(line: string): { title: string; description: string; valueLabel?: string } | undefined {
  const cleaned = cleanTelegramLine(line).replace(/^•\s*/, "").trim();
  if (!cleaned) {
    return undefined;
  }

  const valueLabel = extractValueLabel(cleaned);
  const beforePrice = cleaned.split(/💰|€|\banzich[eé]\b/i)[0]?.trim() || cleaned;
  const title = beforePrice.replace(/\s*[|:-]\s*$/, "").trim();

  if (!title || title.length < 8) {
    return undefined;
  }

  return {
    title: title.slice(0, 140),
    description: cleaned.slice(0, 240),
    valueLabel
  };
}

function buildTelegramItem(input: {
  block: TelegramMessageBlock;
  merchantHint: string;
  title: string;
  description: string;
  destinationUrl: string;
  imageUrl?: string;
  valueLabel?: string;
  expiresAtText?: string;
  code?: string;
  confidenceScore: number;
}): NormalizedImportedOffer {
  return {
    merchantHint: input.merchantHint,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    code: input.code,
    valueLabel: input.valueLabel,
    expiresAtText: input.expiresAtText,
    destinationUrl: input.destinationUrl,
    rawUrl: buildTelegramPostUrl(input.block.postPath),
    status: "review",
    confidenceScore: Math.min(input.confidenceScore, 0.95),
    detectedAt: new Date().toISOString(),
    warnings: /amazon\./i.test(input.destinationUrl)
      ? ["Import da preview pubblica Telegram: verificare disponibilita e prezzo prima della pubblicazione."]
      : ["Import da preview pubblica Telegram: il post non espone un link ufficiale diretto, review manuale consigliata."]
  };
}

function extractAmazonMultiItems(input: {
  lines: string[];
  links: string[];
  block: TelegramMessageBlock;
  merchantHint: string;
  imageUrl?: string;
  expiresAtText?: string;
}): NormalizedImportedOffer[] {
  const amazonLinks = input.links.filter((link) => /amazon\./i.test(link));
  const bulletLines = input.lines.filter((line) => /^\s*•/.test(line));

  if (amazonLinks.length < 2 || bulletLines.length < 2) {
    return [];
  }

  const items = bulletLines
    .slice(0, amazonLinks.length)
    .map((line, index) => {
      const parsed = extractBulletOfferLine(line);
      if (!parsed) {
        return undefined;
      }

      return buildTelegramItem({
        block: input.block,
        merchantHint: input.merchantHint,
        title: parsed.title,
        description: parsed.description,
        destinationUrl: amazonLinks[index],
        imageUrl: input.imageUrl,
        valueLabel: parsed.valueLabel,
        expiresAtText: input.expiresAtText,
        confidenceScore: 0.84
      });
    })
    .filter((item): item is NormalizedImportedOffer => Boolean(item));

  return items.length >= 2 ? items : [];
}

export function extractTelegramPublicOffers(html: string, source: Source): NormalizedImportedOffer[] {
  const blocks = extractMessageBlocks(html).slice(0, 25);
  const preset = getTelegramSourcePreset(source);
  const items = blocks.flatMap((block) => {
    const text = extractMessageText(block.html);
    if (!isUsefulTelegramMessage(text)) {
      return [];
    }

    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const links = extractLinks(block.html);
    const amazonLink = links.find((link) => /amazon\./i.test(link));
    const title = extractTelegramTitle(lines, Boolean(amazonLink)).slice(0, 140);
    const merchantHint = amazonLink ? "Amazon" : extractPromoMerchant(title, text) || guessMerchant(text, source.name);
    const valueLabel = extractValueLabel(text);
    const expiresAtText = extractExpiresAtText(text);
    const code = preset?.mode === "amazonDeals" ? undefined : extractCouponCode(text, merchantHint);
    const previewImageUrl = extractMessagePreviewImage(block.html);
    const description =
      lines
        .slice(1, 6)
        .filter((line) => !/preleva qui il codice|guardalo su amazon|views\s+\[|forwarded from/i.test(line))
        .join(" ")
        .trim() || text.slice(0, 220);

    if (preset?.mode === "couponFeed") {
      const officialDomain = inferOfficialMerchantDomain(merchantHint);
      if (!officialDomain || !valueLabel || /whatsapp|telegram/i.test(merchantHint)) {
        return [];
      }
    }

    if (preset?.mode === "amazonDeals" && !amazonLink) {
      return [];
    }

    if (preset?.mode === "amazonDeals") {
      const multiItems = extractAmazonMultiItems({
        lines,
        links,
        block,
        merchantHint,
        imageUrl: previewImageUrl,
        expiresAtText
      });
      if (multiItems.length > 0) {
        return multiItems;
      }
    }

    let confidenceScore = 0.55;
    if (amazonLink) {
      confidenceScore += 0.2;
    }
    if (valueLabel) {
      confidenceScore += 0.1;
    }
    if (code) {
      confidenceScore += 0.1;
    }
    if (expiresAtText) {
      confidenceScore += 0.05;
    }

    return [
      buildTelegramItem({
        block,
        merchantHint,
        title,
        description,
        destinationUrl: amazonLink || source.baseUrl,
        imageUrl: previewImageUrl,
        valueLabel,
        expiresAtText,
        code,
        confidenceScore
      })
    ];
  });

  return items.filter((item) => {
    if (preset?.mode === "amazonDeals") {
      return /amazon\./i.test(item.destinationUrl);
    }

    return true;
  });
}
