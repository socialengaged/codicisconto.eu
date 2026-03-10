import type { Source } from "@/lib/types";

export interface NormalizedImportedOffer {
  merchantHint: string;
  title: string;
  description: string;
  code?: string;
  destinationUrl: string;
  rawUrl: string;
  status: "review";
  confidenceScore: number;
  detectedAt: string;
  warnings: string[];
}

export interface SourceAdapter {
  canHandle(source: Source): boolean;
  fetchOffers(source: Source): Promise<NormalizedImportedOffer[]>;
}
