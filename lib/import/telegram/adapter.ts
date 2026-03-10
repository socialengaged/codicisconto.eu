import { extractTelegramPublicOffers } from "@/lib/import/telegram/extract-public";
import type { SourceAdapter } from "@/lib/import/types";

export const telegramPublicAdapter: SourceAdapter = {
  canHandle(source) {
    return source.kind === "telegramPublic";
  },
  async fetchOffers(source) {
    const response = await fetch(source.baseUrl, {
      headers: {
        "user-agent": "codicisconto.eu telegram importer/1.0"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`La fonte Telegram ${source.name} ha risposto con ${response.status}.`);
    }

    const html = await response.text();
    const items = extractTelegramPublicOffers(html, source);

    if (items.length === 0) {
      throw new Error(`Nessun messaggio utile trovato nella preview pubblica di ${source.name}.`);
    }

    return items;
  }
};
