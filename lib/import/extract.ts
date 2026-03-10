interface ExtractedBlock {
  text: string;
  title: string;
  code?: string;
  valueLabel?: string;
  expiresAtText?: string;
  confidenceScore: number;
}

const DEFAULT_KEYWORDS = ["sconto", "coupon", "codice", "offerta", "promozione", "deal"];

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&euro;/g, "euro")
    .replace(/&ndash;|&mdash;/g, "-");
}

export function stripHtmlPreservingBlocks(input: string): string {
  return decodeEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(article|section|div|li|ul|ol|tr|table|p|br|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

export function detectAuthWall(text: string): string | undefined {
  const normalized = text.toLowerCase();

  if (/enable javascript and cookies to continue/.test(normalized)) {
    return "challenge";
  }

  if (
    /student verification|verified students|student discount|member-only|members only|sign up to unlock|get code after sign in|verifica studente/.test(
      normalized
    )
  ) {
    return "auth";
  }

  return undefined;
}

export function guessMerchant(text: string, fallback: string): string {
  const normalized = text.toLowerCase();
  const merchantCandidates = ["amazon", "zalando", "zalando prive", "farmacia loreto", "temu", "about you"];

  const match = merchantCandidates.find((merchant) => normalized.includes(merchant));
  if (!match) {
    return fallback;
  }

  return match
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function extractOfferBlocks(html: string, keywords: string[] = DEFAULT_KEYWORDS): ExtractedBlock[] {
  const text = stripHtmlPreservingBlocks(html);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = lines
    .filter((line) => line.length >= 25 && line.length <= 260)
    .filter((line) => {
      const normalized = line.toLowerCase();
      return keywords.some((keyword) => normalized.includes(keyword));
    });

  const deduped = Array.from(new Set(candidates)).slice(0, 40);

  return deduped
    .map((line) => {
      const code =
        line.match(/(?:codice|coupon|voucher)[:\s-]*([A-Z0-9_-]{4,20})/i)?.[1] ||
        line.match(/\b[A-Z0-9]{5,12}\b/g)?.find((token) => /\d/.test(token));
      const valueLabel =
        line.match(/-?\d{1,3}\s?%/)?.[0] ||
        line.match(/\d{1,3}(?:[.,]\d{1,2})?\s?(?:euro|€)/i)?.[0] ||
        (/(spedizione gratis|gratis)/i.test(line) ? "Spedizione gratis" : undefined);
      const expiresAtText = line.match(/(?:scade|valido fino al|fino al)\s+([^,.]+)/i)?.[1]?.trim();

      let confidenceScore = 0.4;
      if (valueLabel) {
        confidenceScore += 0.2;
      }
      if (code) {
        confidenceScore += 0.2;
      }
      if (expiresAtText) {
        confidenceScore += 0.1;
      }
      if (line.length < 170) {
        confidenceScore += 0.05;
      }

      return {
        text: line,
        title: line.slice(0, 120),
        code,
        valueLabel,
        expiresAtText,
        confidenceScore: Math.min(confidenceScore, 0.95)
      };
    })
    .sort((left, right) => right.confidenceScore - left.confidenceScore)
    .slice(0, 10);
}
