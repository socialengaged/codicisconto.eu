export type OfferStatus = "draft" | "review" | "published" | "expired" | "rejected";
export type OfferType = "coupon" | "deal";
export type SourceKind = "genericHtml" | "fixture" | "telegramPublic";
export type ImportJobStatus = "idle" | "running" | "completed" | "failed";
export type EditorialArticleType = "news" | "blog";
export type EditorialArticleStatus = "draft" | "published";

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
  isAffiliateEnabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  code?: string;
  type: OfferType;
  valueLabel: string;
  destinationUrl: string;
  trackingUrl: string;
  startsAt: string;
  expiresAt?: string;
  isExclusive: boolean;
  status: OfferStatus;
  sourceId?: string;
  importedOfferId?: string;
  categoryIds: string[];
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportedOffer {
  id: string;
  sourceId: string;
  merchantHint: string;
  title: string;
  description: string;
  imageUrl?: string;
  code?: string;
  valueLabel?: string;
  expiresAtText?: string;
  destinationUrl: string;
  rawUrl: string;
  status: "review" | "published" | "rejected";
  confidenceScore: number;
  payloadHash: string;
  detectedAt: string;
  warnings: string[];
}

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  baseUrl: string;
  isActive: boolean;
  notes?: string;
}

export interface ImportJob {
  id: string;
  sourceId: string;
  status: ImportJobStatus;
  startedAt: string;
  finishedAt?: string;
  importedCount: number;
  warningCount: number;
  error?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin";
}

export interface StoreData {
  merchants: Merchant[];
  categories: Category[];
  offers: Offer[];
  importedOffers: ImportedOffer[];
  sources: Source[];
  importJobs: ImportJob[];
  adminUsers: AdminUser[];
}

export interface OfferView extends Offer {
  merchant: Merchant;
  categories: Category[];
}

export interface ImportedOfferView extends ImportedOffer {
  source: Source;
}

export interface EditorialArticle {
  id: string;
  slug: string;
  type: EditorialArticleType;
  status: EditorialArticleStatus;
  title: string;
  excerpt: string;
  content: string[];
  coverImage: string;
  tags: string[];
  topic: string;
  sourceOfferIds: string[];
  sourceUrls: string[];
  authorName: string;
  publishedAt: string;
  updatedAt: string;
}

export interface EditorialStore {
  articles: EditorialArticle[];
}
