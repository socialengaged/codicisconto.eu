export type OfferStatus = "draft" | "review" | "published" | "expired" | "rejected";
export type OfferType = "coupon" | "deal";
export type SourceKind = "genericHtml" | "fixture";
export type ImportJobStatus = "idle" | "running" | "completed" | "failed";

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
  code?: string;
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
