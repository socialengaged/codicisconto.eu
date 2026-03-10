import { promises as fs } from "node:fs";
import path from "node:path";
import { withAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import type {
  Category,
  ImportedOffer,
  ImportedOfferView,
  ImportJob,
  Merchant,
  Offer,
  OfferStatus,
  OfferView,
  Source,
  StoreData
} from "@/lib/types";
import { buildId, formatDateTime, hashString, slugify, sortByDateDesc } from "@/lib/utils";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

function getAffiliateTag(): string {
  return process.env.AMAZON_AFFILIATE_TAG || "iltuotag-21";
}

async function ensureStoreFile(): Promise<void> {
  try {
    await fs.access(STORE_PATH);
  } catch {
    throw new Error(`Store JSON non trovato in ${STORE_PATH}`);
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStoreFile();
  const content = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(content) as StoreData;
}

export async function writeStore(store: StoreData): Promise<void> {
  await fs.writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function attachOfferRelations(offer: Offer, merchants: Merchant[], categories: Category[]): OfferView {
  const merchant = merchants.find((item) => item.id === offer.merchantId);

  if (!merchant) {
    throw new Error(`Merchant non trovato per offerta ${offer.id}`);
  }

  return {
    ...offer,
    merchant,
    categories: categories.filter((category) => offer.categoryIds.includes(category.id))
  };
}

export async function getPublishedOffers(): Promise<OfferView[]> {
  const store = await readStore();
  return sortByDateDesc(
    store.offers
      .filter((offer) => offer.status === "published")
      .map((offer) => attachOfferRelations(offer, store.merchants, store.categories)),
    (offer) => offer.updatedAt
  );
}

export async function getOfferBySlug(idSlug: string): Promise<OfferView | undefined> {
  const store = await readStore();
  const id = idSlug.split("-")[0];
  const offer = store.offers.find((item) => item.id === id || `${item.id}-${item.slug}` === idSlug);
  return offer ? attachOfferRelations(offer, store.merchants, store.categories) : undefined;
}

export async function getStoreBySlug(slug: string): Promise<{ merchant: Merchant; offers: OfferView[] } | undefined> {
  const store = await readStore();
  const merchant = store.merchants.find((item) => item.slug === slug);

  if (!merchant) {
    return undefined;
  }

  const offers = store.offers
    .filter((offer) => offer.merchantId === merchant.id && offer.status === "published")
    .map((offer) => attachOfferRelations(offer, store.merchants, store.categories));

  return { merchant, offers: sortByDateDesc(offers, (offer) => offer.updatedAt) };
}

export async function getCategoryBySlug(slug: string): Promise<{ category: Category; offers: OfferView[] } | undefined> {
  const store = await readStore();
  const category = store.categories.find((item) => item.slug === slug);

  if (!category) {
    return undefined;
  }

  const offers = store.offers
    .filter((offer) => offer.status === "published" && offer.categoryIds.includes(category.id))
    .map((offer) => attachOfferRelations(offer, store.merchants, store.categories));

  return { category, offers: sortByDateDesc(offers, (offer) => offer.updatedAt) };
}

export async function searchOffers(query: string): Promise<OfferView[]> {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  const offers = await getPublishedOffers();

  return offers.filter((offer) =>
    [offer.title, offer.description, offer.merchant.name, ...offer.categories.map((item) => item.name)]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export async function getHomepageSnapshot(): Promise<{
  featuredOffers: OfferView[];
  latestOffers: OfferView[];
  merchants: Merchant[];
  categories: Category[];
}> {
  const store = await readStore();
  const published = await getPublishedOffers();

  return {
    featuredOffers: published.filter((offer) => offer.isExclusive).slice(0, 4),
    latestOffers: published.slice(0, 8),
    merchants: store.merchants.filter((merchant) => merchant.isActive),
    categories: store.categories
  };
}

export async function getAdminSnapshot(): Promise<{
  offers: OfferView[];
  importedOffers: ImportedOfferView[];
  sources: Source[];
  importJobs: ImportJob[];
  merchants: Merchant[];
  categories: Category[];
}> {
  const store = await readStore();
  const offers = sortByDateDesc(
    store.offers.map((offer) => attachOfferRelations(offer, store.merchants, store.categories)),
    (offer) => offer.updatedAt
  );
  const importedOffers = sortByDateDesc(
    store.importedOffers.map((item) => ({
      ...item,
      source: store.sources.find((source) => source.id === item.sourceId) || store.sources[0]
    })),
    (item) => item.detectedAt
  );

  return {
    offers,
    importedOffers,
    sources: store.sources,
    importJobs: sortByDateDesc(store.importJobs, (job) => job.startedAt),
    merchants: store.merchants,
    categories: store.categories
  };
}

export async function createManualOffer(input: {
  title: string;
  description: string;
  merchantId: string;
  valueLabel: string;
  destinationUrl: string;
  code?: string;
  type: "coupon" | "deal";
  categoryIds: string[];
  status: OfferStatus;
  expiresAt?: string;
}): Promise<Offer> {
  const store = await readStore();
  const merchant = store.merchants.find((item) => item.id === input.merchantId);

  if (!merchant) {
    throw new Error("Merchant non valido.");
  }

  const now = new Date().toISOString();
  const offer: Offer = {
    id: buildId("offer"),
    merchantId: input.merchantId,
    title: input.title.trim(),
    slug: slugify(input.title),
    description: input.description.trim(),
    code: input.code?.trim() || undefined,
    type: input.type,
    valueLabel: input.valueLabel.trim(),
    destinationUrl: input.destinationUrl.trim(),
    trackingUrl: merchant.isAffiliateEnabled
      ? withAmazonAffiliateTag(input.destinationUrl.trim(), getAffiliateTag())
      : input.destinationUrl.trim(),
    startsAt: now,
    expiresAt: input.expiresAt || undefined,
    isExclusive: false,
    status: input.status,
    categoryIds: input.categoryIds,
    createdAt: now,
    updatedAt: now
  };

  store.offers.unshift(offer);
  await writeStore(store);
  return offer;
}

export async function updateOfferStatus(offerId: string, status: OfferStatus): Promise<void> {
  const store = await readStore();
  const offer = store.offers.find((item) => item.id === offerId);

  if (!offer) {
    throw new Error("Offerta non trovata.");
  }

  offer.status = status;
  offer.updatedAt = new Date().toISOString();
  if (status === "published") {
    offer.lastVerifiedAt = new Date().toISOString();
  }
  await writeStore(store);
}

export async function publishImportedOffer(importedOfferId: string): Promise<Offer> {
  const store = await readStore();
  const importedOffer = store.importedOffers.find((item) => item.id === importedOfferId);

  if (!importedOffer) {
    throw new Error("Import non trovato.");
  }

  const merchant =
    store.merchants.find((item) => item.name.toLowerCase() === importedOffer.merchantHint.toLowerCase()) ||
    store.merchants.find((item) => item.slug === slugify(importedOffer.merchantHint));

  if (!merchant) {
    throw new Error("Merchant non associato all'import.");
  }

  const now = new Date().toISOString();
  const offer: Offer = {
    id: buildId("offer"),
    merchantId: merchant.id,
    title: importedOffer.title,
    slug: slugify(importedOffer.title),
    description: importedOffer.description,
    code: importedOffer.code || undefined,
    type: importedOffer.code ? "coupon" : "deal",
    valueLabel: importedOffer.code ? "Coupon" : "Offerta",
    destinationUrl: importedOffer.destinationUrl,
    trackingUrl: merchant.isAffiliateEnabled
      ? withAmazonAffiliateTag(importedOffer.destinationUrl, getAffiliateTag())
      : importedOffer.destinationUrl,
    startsAt: now,
    isExclusive: false,
    status: "published",
    sourceId: importedOffer.sourceId,
    importedOfferId: importedOffer.id,
    categoryIds: [],
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  };

  importedOffer.status = "published";
  store.offers.unshift(offer);
  await writeStore(store);
  return offer;
}

export async function appendImportJob(job: ImportJob): Promise<void> {
  const store = await readStore();
  store.importJobs.unshift(job);
  await writeStore(store);
}

export async function finalizeImportJob(jobId: string, input: Partial<ImportJob>): Promise<void> {
  const store = await readStore();
  const job = store.importJobs.find((item) => item.id === jobId);

  if (!job) {
    return;
  }

  Object.assign(job, input);
  await writeStore(store);
}

export async function upsertImportedOffers(sourceId: string, items: Omit<ImportedOffer, "id" | "sourceId" | "payloadHash">[]): Promise<{
  importedCount: number;
  warningCount: number;
}> {
  const store = await readStore();
  let importedCount = 0;
  let warningCount = 0;

  for (const item of items) {
    const fingerprint = hashString([sourceId, item.title, item.code || "", item.destinationUrl].join("|"));
    const existing = store.importedOffers.find((entry) => entry.payloadHash === fingerprint);

    if (existing) {
      existing.title = item.title;
      existing.description = item.description;
      existing.code = item.code;
      existing.destinationUrl = item.destinationUrl;
      existing.rawUrl = item.rawUrl;
      existing.status = "review";
      existing.confidenceScore = item.confidenceScore;
      existing.detectedAt = new Date().toISOString();
      existing.warnings = item.warnings;
      warningCount += existing.warnings.length;
      continue;
    }

    store.importedOffers.unshift({
      ...item,
      id: buildId("imported"),
      sourceId,
      payloadHash: fingerprint
    });
    importedCount += 1;
    warningCount += item.warnings.length;
  }

  await writeStore(store);
  return { importedCount, warningCount };
}

export async function getStatusLabel(status: OfferStatus): Promise<string> {
  return {
    draft: "Bozza",
    review: "In revisione",
    published: "Pubblicata",
    expired: "Scaduta",
    rejected: "Scartata"
  }[status];
}

export function describeImportJob(job: ImportJob): string {
  return `${formatDateTime(job.startedAt)} · ${job.importedCount} nuovi elementi`;
}
