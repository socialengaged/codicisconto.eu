import type { NormalizedImportedOffer, SourceAdapter } from "@/lib/import/types";
import { fixtureAdapter } from "@/lib/import/sources/fixture";
import { genericHtmlAdapter } from "@/lib/import/sources/generic-html";
import { telegramPublicAdapter } from "@/lib/import/telegram/adapter";
import { appendImportJob, finalizeImportJob, readStore, upsertImportedOffers } from "@/lib/store";
import { buildId } from "@/lib/utils";

function getAdapter(kind: string): SourceAdapter {
  switch (kind) {
    case "fixture":
      return fixtureAdapter;
    case "genericHtml":
      return genericHtmlAdapter;
    case "telegramPublic":
      return telegramPublicAdapter;
    default:
      throw new Error(`Nessun adapter registrato per il tipo ${kind}.`);
  }
}

async function importSource(sourceId: string): Promise<{
  importedCount: number;
  warningCount: number;
  sourceName: string;
}> {
  const store = await readStore();
  const source = store.sources.find((item) => item.id === sourceId && item.isActive);

  if (!source) {
    throw new Error("Fonte non trovata o disattivata.");
  }

  const adapter = getAdapter(source.kind);
  const items: NormalizedImportedOffer[] = await adapter.fetchOffers(source);
  const result = await upsertImportedOffers(source.id, items);

  return {
    ...result,
    sourceName: source.name
  };
}

export async function runImportPipeline(sourceId?: string): Promise<{
  importedCount: number;
  warningCount: number;
  jobs: string[];
}> {
  const store = await readStore();
  const sources = sourceId
    ? store.sources.filter((source) => source.id === sourceId && source.isActive)
    : store.sources.filter((source) => source.isActive);

  const jobs: string[] = [];
  let importedCount = 0;
  let warningCount = 0;

  for (const source of sources) {
    const jobId = buildId("job");
    jobs.push(jobId);
    await appendImportJob({
      id: jobId,
      sourceId: source.id,
      status: "running",
      startedAt: new Date().toISOString(),
      importedCount: 0,
      warningCount: 0
    });

    try {
      const result = await importSource(source.id);
      importedCount += result.importedCount;
      warningCount += result.warningCount;

      await finalizeImportJob(jobId, {
        status: "completed",
        importedCount: result.importedCount,
        warningCount: result.warningCount,
        finishedAt: new Date().toISOString()
      });
    } catch (error) {
      await finalizeImportJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Errore sconosciuto",
        finishedAt: new Date().toISOString()
      });
    }
  }

  return { importedCount, warningCount, jobs };
}
