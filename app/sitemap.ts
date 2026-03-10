import type { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/editorial";
import { readStore } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await readStore();
  const articles = await getPublishedArticles();
  const baseUrl = process.env.SITE_URL || "http://localhost:3000";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/feed.xml`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/llms.txt`,
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
      })),
    ...articles.map((article) => ({
      url: `${baseUrl}/${article.type}/${article.slug}`,
      lastModified: new Date(article.updatedAt)
      }))
  ];
}
