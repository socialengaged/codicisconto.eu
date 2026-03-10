import { getOfferDisplayDescription, getOfferDisplayTitle } from "@/lib/offer-presenter";
import type { EditorialArticle, OfferView } from "@/lib/types";

export const SITE_NAME = "codicisconto.eu";
export const SITE_DESCRIPTION =
  "Coupon, offerte verificate, guide e news editoriali per Amazon e altri merchant con aggiornamenti strutturati per Search, Discover e Google News.";
export const SITE_LOCALE = "it_IT";
export const DEFAULT_OG_IMAGE = "/opengraph-image";

export function getBaseUrl(): string {
  return process.env.SITE_URL || "http://localhost:3000";
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, getBaseUrl()).toString();
}

export function siteKeywords(): string[] {
  return [
    "codici sconto",
    "coupon amazon",
    "offerte amazon",
    "coupon verificati",
    "codici promozionali",
    "news offerte",
    "blog coupon",
    "prime day",
    "google discover seo",
    "google news coupon"
  ];
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getBaseUrl(),
    logo: absoluteUrl("/opengraph-image"),
    sameAs: ["https://github.com/socialengaged/codicisconto.eu"]
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getBaseUrl(),
    inLanguage: "it-IT",
    potentialAction: {
      "@type": "SearchAction",
      target: `${getBaseUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function collectionPageSchema(input: {
  title: string;
  description: string;
  url: string;
  itemUrls: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    url: input.url,
    hasPart: input.itemUrls.map((url) => ({
      "@type": "WebPage",
      url
    }))
  };
}

export function offerSchema(offer: OfferView) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: getOfferDisplayTitle(offer),
    description: getOfferDisplayDescription(offer),
    url: absoluteUrl(`/coupon/${offer.id}-${offer.slug}`),
    validFrom: offer.startsAt,
    validThrough: offer.expiresAt,
    seller: {
      "@type": "Organization",
      name: offer.merchant.name
    },
    image: offer.imageUrl ? [offer.imageUrl] : undefined,
    category: offer.categories.map((item) => item.name).join(", "),
    availability: "https://schema.org/InStock"
  };
}

export function articleSchema(article: EditorialArticle, pathname: string) {
  return {
    "@context": "https://schema.org",
    "@type": article.type === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.authorName
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/opengraph-image")
      }
    },
    image: [absoluteUrl(article.coverImage)],
    mainEntityOfPage: absoluteUrl(pathname),
    keywords: article.tags.join(", "),
    about: article.topic
  };
}
