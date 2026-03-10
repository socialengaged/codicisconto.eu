import { NextResponse } from "next/server";
import { runImportPipeline } from "@/lib/import/run-import";
import { publishImportedOffersBatch, syncPresetSources } from "@/lib/store";

const RECOMMENDED_SOURCE_IDS = [
  "source_sconti",
  "source_codicerisparmio",
  "source_topnegozi",
  "source_cuponation_farmacia_loreto",
  "source_discoup_best",
  "source_topnegozi_zalando",
  "source_scontify_farmacia_loreto_app",
  "source_scontify_zalando_prive_newsletter"
];

export async function POST(request: Request) {
  await syncPresetSources({ onlyIds: RECOMMENDED_SOURCE_IDS, activeOnly: true });

  for (const sourceId of RECOMMENDED_SOURCE_IDS) {
    await runImportPipeline(sourceId);
  }

  await publishImportedOffersBatch({
    sourceIds: RECOMMENDED_SOURCE_IDS,
    limit: 24,
    minConfidence: 0.75
  });

  return NextResponse.redirect(new URL("/admin/imports?bootstrapped=1", request.url));
}
