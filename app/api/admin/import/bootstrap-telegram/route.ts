import { NextResponse } from "next/server";
import { runImportPipeline } from "@/lib/import/run-import";
import { clearImportedQueueForSources, enrichPublishedOffers, publishImportedOffersBatch, syncTelegramSources } from "@/lib/store";

const TELEGRAM_SOURCE_IDS = ["source_telegram_migliori_sconti", "source_telegram_codiciscont0"];
const TELEGRAM_AMAZON_SOURCE_IDS = ["source_telegram_codiciscont0"];

export async function POST(request: Request) {
  await syncTelegramSources({ onlyIds: TELEGRAM_SOURCE_IDS });
  await clearImportedQueueForSources(TELEGRAM_SOURCE_IDS);

  for (const sourceId of TELEGRAM_SOURCE_IDS) {
    await runImportPipeline(sourceId);
  }

  await publishImportedOffersBatch({
    sourceIds: TELEGRAM_AMAZON_SOURCE_IDS,
    limit: 12,
    minConfidence: 0.75
  });
  await enrichPublishedOffers({
    sourceIds: TELEGRAM_AMAZON_SOURCE_IDS,
    limit: 18
  });

  return NextResponse.redirect(new URL("/admin/imports?telegram=1", request.url));
}
