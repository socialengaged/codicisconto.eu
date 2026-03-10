import type { MetadataRoute } from "next";
import { readStore } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await readStore();
  const baseUrl = process.env.SITE_URL || "http://localhost:3000";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date()
    },
    ...store.merchants.map((merchant) => ({
      url: `${baseUrl}/store/${merchant.slug}`,
      lastModified: new Date()
    })),
    ...store.categories.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date()
    })),
    ...store.offers
      .filter((offer) => offer.status === "published")
      .map((offer) => ({
        url: `${baseUrl}/coupon/${offer.id}-${offer.slug}`,
        lastModified: new Date(offer.updatedAt)
      }))
  ];
}
