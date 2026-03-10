import type { SourceAdapter } from "@/lib/import/types";
import type { Source } from "@/lib/types";

export const fixtureAdapter: SourceAdapter = {
  canHandle(source: Source) {
    return source.kind === "fixture";
  },
  async fetchOffers() {
    const now = new Date().toISOString();

    return [
      {
        merchantHint: "Amazon",
        title: "15% di sconto su accessori da cucina",
        description: "Import fixture pensato per popolare velocemente la coda review in locale.",
        code: "CUCINA15",
        destinationUrl: "https://www.amazon.it/",
        rawUrl: "fixture://amazon-demo/accessori-cucina",
        status: "review",
        confidenceScore: 0.89,
        detectedAt: now,
        warnings: []
      }
    ];
  }
};
