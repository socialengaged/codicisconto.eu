interface ExtractedBlock {
  text: string;
  title: string;
  code?: string;
  merchantName?: string;
  valueLabel?: string;
  expiresAtText?: string;
  confidenceScore: number;
}

const DEFAULT_KEYWORDS = ["sconto", "coupon", "codice", "offerta", "promozione", "deal"];
const KNOWN_MERCHANT_LABELS: Record<string, string> = {
  amazon: "Amazon",
  zalando: "Zalando",
  "zalando prive": "Zalando Prive",
  "farmacia loreto": "Farmacia Loreto",
  temu: "Temu",
  "about you": "About You",
  smartbox: "Smartbox",
  myprotein: "Myprotein",
  prozis: "Prozis",
  dyson: "Dyson",
  "booking.com": "Booking.com",
  shein: "SHEIN",
  samsung: "Samsung",
  sony: "Sony",
  hotiday: "Hotiday",
  adidas: "Adidas",
  honor: "Honor",
  norauto: "Norauto",
  lagostina: "Lagostina",
  stylevana: "Stylevana",
  trainpal: "TrainPal",
  manomano: "ManoMano",
  colorland: "Colorland",
  zooplus: "Zooplus",
  lookfantastic: "LOOKFANTASTIC",
  iherb: "iHerb",
  notino: "Notino",
  ditano: "Ditano",
  topfarmacia: "TopFarmacia",
  "1000farmacie": "1000Farmacie",
  sarenza: "Sarenza",
  "antony morato": "Antony Morato",
  maxisport: "Maxisport",
  "emma materasso": "Emma Materasso",
  "grandi navi veloci": "Grandi Navi Veloci",
  decathlon: "Decathlon",
  "fiorella rubino": "Fiorella Rubino",
  europcar: "Europcar",
  "levi's": "Levi's",
  levis: "Levi's",
  ebay: "eBay",
  asos: "ASOS",
  sinsay: "Sinsay",
  drmax: "Dr. Max",
  crocs: "Crocs",
  feltrinelli: "Feltrinelli",
  heydude: "HEYDUDE",
  sklum: "Sklum",
  "profumeriaweb": "ProfumeriaWeb"
};
const KNOWN_MERCHANTS = [
  "amazon",
  "zalando",
  "zalando prive",
  "farmacia loreto",
  "temu",
  "about you",
  "smartbox",
  "myprotein",
  "prozis",
  "dyson",
  "booking.com",
  "shein",
  "samsung",
  "sony",
  "hotiday",
  "adidas",
  "honor",
  "norauto",
  "lagostina",
  "stylevana",
  "trainpal",
  "manomano",
  "colorland",
  "zooplus",
  "lookfantastic",
  "iherb",
  "notino",
  "ditano",
  "topfarmacia",
  "1000farmacie",
  "sarenza",
  "antony morato",
  "maxisport",
  "emma materasso",
  "grandi navi veloci",
  "decathlon",
  "fiorella rubino",
  "europcar",
  "levi's",
  "levis",
  "ebay",
  "asos",
  "sinsay",
  "drmax",
  "crocs",
  "feltrinelli",
  "heydude",
  "sklum",
  "profumeriaweb"
];
const CODE_STOPWORDS = new Set([
  "SCONTO",
  "CODICE",
  "COUPON",
  "VOUCHER",
  "ESCLUSIVO",
  "PROMO",
  "PROMOZIONALE",
  "OFFERTA",
  "VERIFICATO",
  "SOLO",
  "ORA",
  "INFO",
  "EXTRA"
]);
const MERCHANT_STOPWORDS = new Set([
  "del",
  "della",
  "di",
  "fino",
  "fino al",
  "da",
  "per",
  "ottieni",
  "approfitta",
  "selezionata",
  "condizioni",
  "esclusivo",
  "esclusiva",
  "sconto",
  "coupon",
  "codice",
  "offerta",
  "promo",
  "promozione",
  "valido",
  "scopri"
]);
const GENERIC_NOISE = [
  "tutti i diritti riservati",
  "privacy policy",
  "cookie policy",
  "newsletter",
  "iscriviti",
  "scopri tutti i codici",
  "copyright",
  "diventa nostro partner"
];

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((token) => {
      if (token === token.toUpperCase() && token.length <= 4) {
        return token;
      }
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
}

function toCanonicalMerchantLabel(value: string): string {
  const normalized = value.toLowerCase();
  return KNOWN_MERCHANT_LABELS[normalized] || toTitleCase(value);
}

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
  const match = KNOWN_MERCHANTS.find((merchant) => normalized.includes(merchant));
  if (!match) {
    return normalizeMerchantName(fallback) || fallback;
  }

  return normalizeMerchantName(match) || fallback;
}

export function normalizeMerchantName(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = decodeEntities(value)
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.!#-]+|[\s:;,.!#-]+$/g, "")
    .trim();
  const normalized = cleaned.toLowerCase();

  if (!cleaned || cleaned.length < 2 || MERCHANT_STOPWORDS.has(normalized)) {
    return undefined;
  }

  if (/^(fino al|da |per |ottieni|approfitta|condizioni|saldi |sconti )/i.test(cleaned)) {
    return undefined;
  }

  const known = KNOWN_MERCHANTS.find((merchant) => normalized.includes(merchant));
  if (known) {
    return toCanonicalMerchantLabel(known);
  }

  if (!/[a-z]/i.test(cleaned) || cleaned.split(" ").length > 4) {
    return undefined;
  }

  return toCanonicalMerchantLabel(cleaned);
}

export function sanitizeCode(code?: string, merchantName?: string): string | undefined {
  if (!code) {
    return undefined;
  }

  const cleaned = code.replace(/[^A-Z0-9_-]/gi, "").toUpperCase();
  const normalizedMerchant = merchantName?.replace(/[^A-Z0-9_-]/gi, "").toUpperCase();
  const isKnownMerchant = KNOWN_MERCHANTS.some((merchant) => merchant.replace(/[^A-Z0-9_-]/gi, "").toUpperCase() === cleaned);
  const hasDigit = /\d/.test(cleaned);
  const looksLikeVanityCode = /^[A-Z]{4,12}$/.test(cleaned);

  if (
    !cleaned ||
    cleaned.length < 4 ||
    CODE_STOPWORDS.has(cleaned) ||
    cleaned === normalizedMerchant ||
    isKnownMerchant ||
    (!hasDigit && looksLikeVanityCode)
  ) {
    return undefined;
  }

  return cleaned;
}

export function extractMerchantName(line: string): string | undefined {
  const patterns = [
    /^([A-Z][A-Za-z0-9.'&-]+(?:\s+[A-Z][A-Za-z0-9.'&-]+){0,2}):/,
    /(?:codice sconto|codice promo|codice promozionale|coupon|offerta)\s+([A-Z][A-Za-z0-9.'&-]+(?:\s+[A-Z][A-Za-z0-9.'&-]+){0,2})/i,
    /([A-Z][A-Za-z0-9.'&-]+(?:\s+[A-Z][A-Za-z0-9.'&-]+){0,2})\s+(?:fino al|del|di)\s+-?\d{1,3}\s?(?:%|€|euro)/i
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern)?.[1]?.trim();
    const normalized = normalizeMerchantName(match);
    if (normalized && !/codice|coupon|offerta|sconto/i.test(normalized)) {
      return normalized;
    }
  }

  return undefined;
}

export function extractOfferBlocks(html: string, keywords: string[] = DEFAULT_KEYWORDS): ExtractedBlock[] {
  const text = stripHtmlPreservingBlocks(html);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = lines
    .filter((line) => line.length >= 25 && line.length <= 260)
    .filter((line) => !GENERIC_NOISE.some((noise) => line.toLowerCase().includes(noise)))
    .filter((line) => {
      const normalized = line.toLowerCase();
      return keywords.some((keyword) => normalized.includes(keyword));
    });

  const deduped = Array.from(new Set(candidates)).slice(0, 40);

  return deduped
    .map((line) => {
      const merchantName = extractMerchantName(line) || normalizeMerchantName(guessMerchant(line, ""));
      const rawCode =
        line.match(/(?:codice|coupon|voucher)[:\s-]*([A-Z0-9_-]{4,20})/i)?.[1] ||
        line.match(/\b[A-Z0-9]{5,12}\b/g)?.find((token) => /\d/.test(token));
      const code = sanitizeCode(rawCode, merchantName);
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
        merchantName,
        valueLabel,
        expiresAtText,
        confidenceScore: Math.min(confidenceScore, 0.95)
      };
    })
    .sort((left, right) => right.confidenceScore - left.confidenceScore)
    .slice(0, 10);
}
