import { getPublishedArticles } from "@/lib/editorial";
import { getBaseUrl } from "@/lib/seo";

export async function GET() {
  const baseUrl = getBaseUrl();
  const articles = (await getPublishedArticles("news")).slice(0, 1000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles
  .map(
    (article) => `<url>
  <loc>${baseUrl}/news/${article.slug}</loc>
  <news:news>
    <news:publication>
      <news:name>codicisconto.eu</news:name>
      <news:language>it</news:language>
    </news:publication>
    <news:publication_date>${article.publishedAt}</news:publication_date>
    <news:title><![CDATA[${article.title}]]></news:title>
  </news:news>
</url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8"
    }
  });
}
