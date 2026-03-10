import { getPublishedArticles } from "@/lib/editorial";
import { getBaseUrl } from "@/lib/seo";

export async function GET() {
  const baseUrl = getBaseUrl();
  const articles = (await getPublishedArticles()).slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>codicisconto.eu</title>
    <link>${baseUrl}</link>
    <description>Feed editoriale con news e blog post su coupon, offerte e promozioni monitorate.</description>
    <language>it-it</language>
    ${articles
      .map((article) => {
        const path = article.type === "news" ? `/news/${article.slug}` : `/blog/${article.slug}`;
        return `<item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}${path}</link>
      <guid>${baseUrl}${path}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${article.excerpt}]]></description>
    </item>`;
      })
      .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8"
    }
  });
}
