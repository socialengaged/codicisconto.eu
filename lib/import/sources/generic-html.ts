import { stripHtmlPreservingBlocks, detectAuthWall, extractOfferBlocks, guessMerchant } from "@/lib/import/extract";
import { getSourcePreset } from "@/lib/import/source-presets";
import { hashString } from "@/lib/utils";
import type { SourceAdapter } from "@/lib/import/types";
import type { Source } from "@/lib/types";

function extractFirstCode(text: string): string | undefined {
  const match = text.match(/\b[A-Z0-9]{5,12}\b/g)?.find((token) => /\d/.test(token));
  return match;
}

function extractMerchantHint(source: Source, text: string): string {
  const preset = getSourcePreset(source);
  return guessMerchant(text, preset?.merchantHint || source.name);
}

export const genericHtmlAdapter: SourceAdapter = {
  canHandle(source: Source) {
    return source.kind === "genericHtml";
  },
  async fetchOffers(source: Source) {
    const response = await fetch(source.baseUrl, {
      headers: {
        "user-agent": "codicisconto.eu importer/1.0"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`La fonte ${source.name} ha risposto con ${response.status}.`);
    }

    const html = await response.text();
    const preset = getSourcePreset(source);
    const text = stripHtmlPreservingBlocks(html);
    const accessIssue = detectAuthWall(text);

    if (accessIssue === "challenge") {
      throw new Error(`La fonte ${source.name} presenta un challenge JavaScript/cookie non adatto a fetch server-side.`);
    }

    if (accessIssue === "auth") {
      throw new Error(`La fonte ${source.name} richiede autenticazione o verifica utente.`);
    }

    const blocks = extractOfferBlocks(html, preset?.keywords);

    if (blocks.length === 0) {
      const fallbackText = text
        .split("\n")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length >= 40)
        .slice(0, 5);

      return fallbackText.map((chunk, index) => ({
        merchantHint: extractMerchantHint(source, chunk),
        title: chunk.slice(0, 110).trim(),
        description: chunk,
        code: extractFirstCode(chunk),
        valueLabel: undefined,
        expiresAtText: undefined,
        destinationUrl: source.baseUrl,
        rawUrl: `${source.baseUrl}#${hashString(`${source.id}-${index}-fallback`)}`,
        status: "review" as const,
        confidenceScore: 0.42,
        detectedAt: new Date().toISOString(),
        warnings: ["Pagina poco strutturata: review manuale necessaria con fallback testuale."]
      }));
    }

    return blocks.map((block, index) => {
      const title = block.title.slice(0, 110).trim();

      return {
        merchantHint: block.merchantName || extractMerchantHint(source, block.text),
        title,
        description: block.text,
        code: block.code || extractFirstCode(block.text),
        valueLabel: block.valueLabel,
        expiresAtText: block.expiresAtText,
        destinationUrl: source.baseUrl,
        rawUrl: `${source.baseUrl}#${hashString(`${source.id}-${index}-${title}`)}`,
        status: "review" as const,
        confidenceScore: block.confidenceScore,
        detectedAt: new Date().toISOString(),
        warnings: [
          block.expiresAtText
            ? `Scadenza testuale rilevata: ${block.expiresAtText}. Verificare prima della pubblicazione.`
            : "Verifica manualmente la validita del codice e la data di scadenza."
        ]
      };
    });
  }
};
