import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL || "http://localhost:3000";
  const host = new URL(baseUrl).host;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/news", "/blog", "/feed.xml", "/llms.txt"],
        disallow: ["/admin", "/api/admin"]
      }
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
    host
  };
}
