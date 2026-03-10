import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { withAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import { categoryPresets, inferCategoryPresetIds } from "@/lib/category-presets";
import { extractMerchantName, guessMerchant, normalizeMerchantName, sanitizeCode } from "@/lib/import/extract";
import { telegramSourcePresets } from "@/lib/import/telegram/presets";
import { buildOfficialMerchantUrl, inferOfficialMerchantDomain, isOfficialMerchantUrl } from "@/lib/merchant-official";
import { fetchOfficialPageImage } from "@/lib/offer-enrichment";
import { sourcePresets } from "@/lib/import/source-presets";
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

function syncCategoryPresetsInStore(store: StoreData): void {
  for (const preset of categoryPresets) {
    const existing = store.categories.find((item) => item.id === preset.id || item.slug === preset.slug);
    if (existing) {
      existing.name = preset.name;
      existing.slug = preset.slug;
      existing.description = preset.description;
      continue;
    }

    store.categories.push({
      id: preset.id,
      name: preset.name,
      slug: preset.slug,
      description: preset.description
    });
  }
}

function getAffiliateTag(): string {
  return process.env.AMAZON_AFFILIATE_TAG || "iltuotag-21";
}

function buildMerchantTrackingUrl(merchant: Merchant, offerTitle: string, currentUrl?: string): string {
  const officialUrl = buildOfficialMerchantUrl({
    merchantName: merchant.name,
    merchantDomain: merchant.domain || undefined,
    offerTitle,
    currentUrl,
    affiliateTag: merchant.isAffiliateEnabled ? getAffiliateTag() : undefined
  });

  return merchant.isAffiliateEnabled && /amazon\./i.test(officialUrl)
    ? withAmazonAffiliateTag(officialUrl, getAffiliateTag())
    : officialUrl;
}

async function ensureStoreFile(): Promise<void> {
  try {
    await fs.access(STORE_PATH);
  } catch {
    throw new Error(`Store JSON non trovato in ${STORE_PATH}`);
  }
}

export async function readStore(): Promise<StoreData> {
  noStore();
  await ensureStoreFile();
  const content = await fs.readFile(STORE_PATH, "utf8");
  const store = JSON.parse(content) as StoreData;
  syncCategoryPresetsInStore(store);
  return store;
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

function hasPublicOfficialLink(offer: Offer, merchant: Merchant): boolean {
  return isOfficialMerchantUrl(offer.trackingUrl, merchant.domain || undefined);
}

function guessCategoryIds(store: StoreData, text: string, merchantName?: string): string[] {
  return inferCategoryPresetIds(text, merchantName)
    .map((categoryId) => store.categories.find((item) => item.id === categoryId)?.id)
    .filter((id): id is string => Boolean(id));
}

function isMeaningfulMerchantName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const invalidStarts = [
    "fino al",
    "da ",
    "per ",
    "ottieni",
    "approfitta",
    "selezionata",
    "scarpe",
    "saldi",
    "condizioni",
    "sconti "
  ];

  return normalized !== "marketplace" && !invalidStarts.some((value) => normalized.startsWith(value));
}

function resolveMerchantName(input: {
  merchantHint?: string;
  title?: string;
  description?: string;
  source?: Source;
}): string {
  const fromHint = normalizeMerchantName(input.merchantHint);
  const fromTitle = extractMerchantName(input.title || "");
  const fromSource = input.source
    ? normalizeMerchantName(guessMerchant(`${input.source.name} ${input.source.baseUrl}`, ""))
    : undefined;
  const guessedFromText = normalizeMerchantName(guessMerchant(`${input.title || ""} ${input.description || ""}`, ""));
  const fromDescription = extractMerchantName(input.description || "");

  return fromHint || fromTitle || fromSource || guessedFromText || fromDescription || "Marketplace";
}

function ensureMerchant(store: StoreData, merchantHint: string): Merchant {
  const normalizedHint = resolveMerchantName({ merchantHint });
  const existing =
    store.merchants.find((item) => item.name.toLowerCase() === normalizedHint.toLowerCase()) ||
    store.merchants.find((item) => item.slug === slugify(normalizedHint));

  if (existing) {
    if (!existing.domain) {
      existing.domain = inferOfficialMerchantDomain(existing.name) || existing.domain;
    }
    return existing;
  }

  const merchant: Merchant = {
    id: buildId("merchant"),
    name: normalizedHint,
    slug: slugify(normalizedHint),
    domain: inferOfficialMerchantDomain(normalizedHint) || "",
    description: `Promozioni e offerte monitorate per ${normalizedHint}, con rimando al sito ufficiale del merchant.`,
    logoUrl: "",
    isActive: true,
    isAffiliateEnabled: /amazon/i.test(normalizedHint)
  };

  store.merchants.push(merchant);
  return merchant;
}

function dedupeMerchants(store: StoreData): void {
  const bySlug = new Map<string, Merchant>();
  const replacements = new Map<string, string>();

  for (const merchant of store.merchants) {
    const normalizedName = normalizeMerchantName(merchant.name) || merchant.name;
    const normalizedSlug = slugify(normalizedName);
    merchant.name = normalizedName;
    merchant.slug = normalizedSlug;
    if (!merchant.domain) {
      merchant.domain = inferOfficialMerchantDomain(merchant.name) || "";
    }
    merchant.description = `Promozioni e offerte monitorate per ${merchant.name}, con rimando al sito ufficiale del merchant.`;

    const existing = bySlug.get(normalizedSlug);
    if (!existing) {
      bySlug.set(normalizedSlug, merchant);
      continue;
    }

    existing.isActive = existing.isActive || merchant.isActive;
    existing.isAffiliateEnabled = existing.isAffiliateEnabled || merchant.isAffiliateEnabled;
    if (!existing.domain) {
      existing.domain = merchant.domain;
    }
    replacements.set(merchant.id, existing.id);
  }

  for (const offer of store.offers) {
    const replacement = replacements.get(offer.merchantId);
    if (replacement) {
      offer.merchantId = replacement;
    }
  }

  const referencedMerchants = new Set(store.offers.map((offer) => offer.merchantId));
  store.merchants = Array.from(bySlug.values()).filter(
    (merchant) => referencedMerchants.has(merchant.id) || ["amazon", "marketplace-tech"].includes(merchant.slug)
  );
}

export async function getPublishedOffers(): Promise<OfferView[]> {
  const store = await readStore();
  return sortByDateDesc(
    store.offers
      .filter((offer) => offer.status === "published")
      .map((offer) => attachOfferRelations(offer, store.merchants, store.categories))
      .filter((offer) => hasPublicOfficialLink(offer, offer.merchant)),
    (offer) => offer.updatedAt
  );
}

export async function getOfferBySlug(idSlug: string): Promise<OfferView | undefined> {
  const store = await readStore();
  const id = idSlug.split("-")[0];
  const offer = store.offers.find((item) => item.id === id || `${item.id}-${item.slug}` === idSlug);
  if (!offer) {
    return undefined;
  }

  const offerView = attachOfferRelations(offer, store.merchants, store.categories);
  return hasPublicOfficialLink(offerView, offerView.merchant) ? offerView : undefined;
}

export async function getStoreBySlug(slug: string): Promise<{ merchant: Merchant; offers: OfferView[] } | undefined> {
  const store = await readStore();
  const merchant = store.merchants.find((item) => item.slug === slug);

  if (!merchant) {
    return undefined;
  }

  const offers = store.offers
    .filter((offer) => offer.merchantId === merchant.id && offer.status === "published")
    .map((offer) => attachOfferRelations(offer, store.merchants, store.categories))
    .filter((offer) => hasPublicOfficialLink(offer, offer.merchant));

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
    .map((offer) => attachOfferRelations(offer, store.merchants, store.categories))
    .filter((offer) => hasPublicOfficialLink(offer, offer.merchant));

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
  const homepageEligible = published.filter(
    (offer) =>
      !/^condizioni:/i.test(offer.title) &&
      !/^grazie a questo coupon ottieni/i.test(offer.title) &&
      !/^scopri /i.test(offer.title)
  );
  const homepageSorted = [...homepageEligible].sort((left, right) => {
    const leftScore = Number(Boolean(left.code)) + Number(Boolean(left.valueLabel)) + Number(Boolean(left.isExclusive));
    const rightScore = Number(Boolean(right.code)) + Number(Boolean(right.valueLabel)) + Number(Boolean(right.isExclusive));
    return rightScore - leftScore;
  });
  const categoryUsage = new Map<string, number>();

  for (const offer of homepageSorted) {
    for (const category of offer.categories) {
      categoryUsage.set(category.id, (categoryUsage.get(category.id) || 0) + 1);
    }
  }

  return {
    featuredOffers: homepageSorted.filter((offer) => offer.isExclusive || Boolean(offer.code)).slice(0, 4),
    latestOffers: homepageSorted.slice(0, 8),
    merchants: Array.from(new Map(homepageSorted.map((offer) => [offer.merchant.id, offer.merchant])).values())
      .filter((merchant) => merchant.isActive && isMeaningfulMerchantName(merchant.name))
      .slice(0, 12),
    categories: [...store.categories]
      .filter((category) => (categoryUsage.get(category.id) || 0) > 0)
      .sort((left, right) => (categoryUsage.get(right.id) || 0) - (categoryUsage.get(left.id) || 0))
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

export async function cleanupImportedData(): Promise<{ cleanedOffers: number; cleanedImports: number; merchants: number }> {
  const store = await readStore();
  syncCategoryPresetsInStore(store);
  const sourceById = new Map(store.sources.map((source) => [source.id, source]));
  let cleanedOffers = 0;
  let cleanedImports = 0;

  for (const importedOffer of store.importedOffers) {
    const source = sourceById.get(importedOffer.sourceId);
    const merchantName = resolveMerchantName({
      merchantHint: importedOffer.merchantHint,
      title: importedOffer.title,
      description: importedOffer.description,
      source
    });
    const merchant = ensureMerchant(store, merchantName);

    importedOffer.merchantHint = merchantName;
    importedOffer.code = sanitizeCode(importedOffer.code, merchantName);
    importedOffer.destinationUrl = buildMerchantTrackingUrl(merchant, importedOffer.title, importedOffer.destinationUrl);
    importedOffer.imageUrl = importedOffer.imageUrl || undefined;
    cleanedImports += 1;
  }

  for (const offer of store.offers) {
    const source = offer.sourceId ? sourceById.get(offer.sourceId) : undefined;
    const importedOffer = offer.importedOfferId ? store.importedOffers.find((item) => item.id === offer.importedOfferId) : undefined;
    const merchantName = resolveMerchantName({
      merchantHint: importedOffer?.merchantHint || store.merchants.find((item) => item.id === offer.merchantId)?.name,
      title: offer.title,
      description: offer.description,
      source
    });
    const merchant = ensureMerchant(store, merchantName);
    const officialUrl = buildMerchantTrackingUrl(merchant, offer.title, offer.destinationUrl);

    offer.merchantId = merchant.id;
    offer.code = sanitizeCode(importedOffer?.code || offer.code, merchant.name);
    offer.type = offer.code || /(?:codice|coupon|voucher)/i.test(offer.title) ? "coupon" : "deal";
    offer.categoryIds = guessCategoryIds(store, `${offer.title} ${offer.description}`, merchant.name);
    offer.valueLabel =
      importedOffer?.valueLabel ||
      (offer.valueLabel && !["Coupon", "Offerta"].includes(offer.valueLabel) ? offer.valueLabel : offer.code ? "Coupon" : "Offerta");
    offer.destinationUrl = officialUrl;
    offer.trackingUrl = officialUrl;
    offer.imageUrl = offer.imageUrl || importedOffer?.imageUrl || undefined;
    cleanedOffers += 1;
  }

  dedupeMerchants(store);
  await writeStore(store);

  return {
    cleanedOffers,
    cleanedImports,
    merchants: store.merchants.length
  };
}

export async function enrichPublishedOffers(input?: {
  sourceIds?: string[];
  limit?: number;
}): Promise<{ updatedOffers: number; updatedImages: number; updatedCategories: number }> {
  const store = await readStore();
  syncCategoryPresetsInStore(store);
  const limit = input?.limit ?? 16;
  const sourceById = new Map(store.sources.map((source) => [source.id, source]));
  let updatedOffers = 0;
  let updatedImages = 0;
  let updatedCategories = 0;

  const candidates = sortByDateDesc(
    store.offers.filter((offer) => offer.status === "published").filter((offer) => (input?.sourceIds ? input.sourceIds.includes(offer.sourceId || "") : true)),
    (offer) => offer.updatedAt
  ).slice(0, limit);

  for (const offer of candidates) {
    const merchant = store.merchants.find((item) => item.id === offer.merchantId);
    const importedOffer = offer.importedOfferId ? store.importedOffers.find((item) => item.id === offer.importedOfferId) : undefined;
    const source = offer.sourceId ? sourceById.get(offer.sourceId) : undefined;

    if (!merchant) {
      continue;
    }

    let changed = false;
    const derivedCategories = guessCategoryIds(store, `${offer.title} ${offer.description}`, merchant.name);
    if (derivedCategories.length > 0 && JSON.stringify(offer.categoryIds) !== JSON.stringify(derivedCategories)) {
      offer.categoryIds = derivedCategories;
      updatedCategories += 1;
      changed = true;
    }

    if (!offer.imageUrl && importedOffer?.imageUrl) {
      offer.imageUrl = importedOffer.imageUrl;
      changed = true;
    }

    const shouldFetchOfficialImage = !offer.imageUrl || /t\.me|cdn\d+\.telegram/i.test(offer.imageUrl);
    if (shouldFetchOfficialImage && hasPublicOfficialLink(offer, merchant)) {
      const fetchedImage = await fetchOfficialPageImage(offer.destinationUrl).catch(() => undefined);
      if (fetchedImage && fetchedImage !== offer.imageUrl) {
        offer.imageUrl = fetchedImage;
        if (importedOffer) {
          importedOffer.imageUrl = fetchedImage;
        }
        updatedImages += 1;
        changed = true;
      }
    }

    if (importedOffer) {
      importedOffer.merchantHint = resolveMerchantName({
        merchantHint: importedOffer.merchantHint,
        title: offer.title,
        description: offer.description,
        source
      });
    }

    if (changed) {
      offer.updatedAt = new Date().toISOString();
      updatedOffers += 1;
    }
  }

  await writeStore(store);
  return { updatedOffers, updatedImages, updatedCategories };
}

export async function syncPresetSources(input?: { onlyIds?: string[]; activeOnly?: boolean }): Promise<Source[]> {
  const store = await readStore();
  syncCategoryPresetsInStore(store);
  const desired = sourcePresets.filter((preset) => {
    if (input?.onlyIds && !input.onlyIds.includes(preset.id)) {
      return false;
    }
    if (input?.activeOnly && preset.strategy === "skip") {
      return false;
    }
    return true;
  });

  for (const preset of desired) {
    const existing = store.sources.find((source) => source.id === preset.id);
    if (existing) {
      existing.name = preset.name;
      existing.baseUrl = preset.url;
      existing.kind = "genericHtml";
      existing.isActive = preset.strategy !== "skip";
      existing.notes = `Sync preset: ${preset.strategy}`;
      continue;
    }

    store.sources.push({
      id: preset.id,
      name: preset.name,
      kind: "genericHtml",
      baseUrl: preset.url,
      isActive: preset.strategy !== "skip",
      notes: `Sync preset: ${preset.strategy}`
    });
  }

  await writeStore(store);
  return store.sources;
}

export async function syncTelegramSources(input?: { onlyIds?: string[] }): Promise<Source[]> {
  const store = await readStore();
  syncCategoryPresetsInStore(store);
  const desired = telegramSourcePresets.filter((preset) => {
    if (input?.onlyIds && !input.onlyIds.includes(preset.id)) {
      return false;
    }
    return true;
  });

  for (const preset of desired) {
    const existing = store.sources.find((source) => source.id === preset.id);
    if (existing) {
      existing.name = preset.name;
      existing.baseUrl = preset.url;
      existing.kind = "telegramPublic";
      existing.isActive = true;
      existing.notes = `Sync telegram preview: @${preset.channelHandle}`;
      continue;
    }

    store.sources.push({
      id: preset.id,
      name: preset.name,
      kind: "telegramPublic",
      baseUrl: preset.url,
      isActive: true,
      notes: `Sync telegram preview: @${preset.channelHandle}`
    });
  }

  await writeStore(store);
  return store.sources;
}

export async function clearImportedQueueForSources(sourceIds: string[]): Promise<number> {
  const store = await readStore();
  syncCategoryPresetsInStore(store);
  const before = store.importedOffers.length;
  store.importedOffers = store.importedOffers.filter(
    (item) => !(sourceIds.includes(item.sourceId) && item.status === "review")
  );
  await writeStore(store);
  return before - store.importedOffers.length;
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
  syncCategoryPresetsInStore(store);
  const merchant = store.merchants.find((item) => item.id === input.merchantId);

  if (!merchant) {
    throw new Error("Merchant non valido.");
  }

  const now = new Date().toISOString();
  const derivedCategoryIds =
    input.categoryIds.length > 0 ? input.categoryIds : guessCategoryIds(store, `${input.title} ${input.description}`, merchant.name);
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
    trackingUrl: isOfficialMerchantUrl(input.destinationUrl.trim(), merchant.domain || undefined)
      ? buildMerchantTrackingUrl(merchant, input.title.trim(), input.destinationUrl.trim())
      : input.destinationUrl.trim(),
    startsAt: now,
    expiresAt: input.expiresAt || undefined,
    isExclusive: false,
    status: input.status,
    categoryIds: derivedCategoryIds,
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
  syncCategoryPresetsInStore(store);
  const importedOffer = store.importedOffers.find((item) => item.id === importedOfferId);

  if (!importedOffer) {
    throw new Error("Import non trovato.");
  }

  const source = store.sources.find((item) => item.id === importedOffer.sourceId);
  const merchant = ensureMerchant(
    store,
    resolveMerchantName({
      merchantHint: importedOffer.merchantHint,
      title: importedOffer.title,
      description: importedOffer.description,
      source
    })
  );
  const offerCategoryIds = guessCategoryIds(store, `${importedOffer.title} ${importedOffer.description}`, merchant.name);
  const normalizedCode = sanitizeCode(importedOffer.code, merchant.name);
  const officialUrl = buildMerchantTrackingUrl(merchant, importedOffer.title, importedOffer.destinationUrl);

  const now = new Date().toISOString();
  const offer: Offer = {
    id: buildId("offer"),
    merchantId: merchant.id,
    title: importedOffer.title,
    slug: slugify(importedOffer.title),
    description: importedOffer.description,
    imageUrl: importedOffer.imageUrl,
    code: normalizedCode,
    type: normalizedCode || /(?:codice|coupon|voucher)/i.test(importedOffer.title) ? "coupon" : "deal",
    valueLabel: importedOffer.valueLabel || (normalizedCode ? "Coupon" : "Offerta"),
    destinationUrl: officialUrl,
    trackingUrl: officialUrl,
    startsAt: now,
    isExclusive: false,
    status: "published",
    sourceId: importedOffer.sourceId,
    importedOfferId: importedOffer.id,
    categoryIds: offerCategoryIds,
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  };

  importedOffer.status = "published";
  store.offers.unshift(offer);
  await writeStore(store);
  return offer;
}

export async function publishImportedOffersBatch(input?: { sourceIds?: string[]; limit?: number; minConfidence?: number }): Promise<number> {
  const store = await readStore();
  syncCategoryPresetsInStore(store);
  const limit = input?.limit ?? 20;
  const minConfidence = input?.minConfidence ?? 0.6;
  const candidates = store.importedOffers
    .filter((item) => item.status === "review")
    .filter((item) => (input?.sourceIds ? input.sourceIds.includes(item.sourceId) : true))
    .filter((item) => item.confidenceScore >= minConfidence)
    .slice(0, limit);

  let published = 0;

  for (const candidate of candidates) {
    const source = store.sources.find((item) => item.id === candidate.sourceId);
    const resolvedMerchantName = resolveMerchantName({
      merchantHint: candidate.merchantHint,
      title: candidate.title,
      description: candidate.description,
      source
    });
    const existingMerchant =
      store.merchants.find((item) => item.name.toLowerCase() === resolvedMerchantName.toLowerCase()) ||
      store.merchants.find((item) => item.slug === slugify(resolvedMerchantName));
    const duplicate = store.offers.find(
      (offer) => offer.importedOfferId === candidate.id || (offer.title === candidate.title && existingMerchant && offer.merchantId === existingMerchant.id)
    );

    if (duplicate) {
      continue;
    }

    await publishImportedOffer(candidate.id);
    published += 1;
  }

  return published;
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
  syncCategoryPresetsInStore(store);
  const source = store.sources.find((entry) => entry.id === sourceId);
  let importedCount = 0;
  let warningCount = 0;

  for (const item of items) {
    const merchantName = resolveMerchantName({
      merchantHint: item.merchantHint,
      title: item.title,
      description: item.description,
      source
    });
    const merchant = ensureMerchant(store, merchantName);
    const normalizedCode = sanitizeCode(item.code, merchantName);
    const normalizedItem = {
      ...item,
      merchantHint: merchantName,
      code: normalizedCode,
      destinationUrl: buildMerchantTrackingUrl(merchant, item.title, item.destinationUrl)
    };
    const fingerprint = hashString([sourceId, normalizedItem.title, normalizedItem.code || "", normalizedItem.destinationUrl].join("|"));
    const existing = store.importedOffers.find((entry) => entry.payloadHash === fingerprint);

    if (existing) {
      existing.merchantHint = normalizedItem.merchantHint;
      existing.title = normalizedItem.title;
      existing.description = normalizedItem.description;
      existing.imageUrl = normalizedItem.imageUrl;
      existing.code = normalizedItem.code;
      existing.valueLabel = normalizedItem.valueLabel;
      existing.expiresAtText = normalizedItem.expiresAtText;
      existing.destinationUrl = normalizedItem.destinationUrl;
      existing.rawUrl = normalizedItem.rawUrl;
      existing.status = "review";
      existing.confidenceScore = normalizedItem.confidenceScore;
      existing.detectedAt = new Date().toISOString();
      existing.warnings = normalizedItem.warnings;
      warningCount += existing.warnings.length;
      continue;
    }

    store.importedOffers.unshift({
      ...normalizedItem,
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
