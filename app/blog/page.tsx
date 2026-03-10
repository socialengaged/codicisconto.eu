import type { Metadata } from "next";
import { EditorialCard } from "@/components/editorial-card";
import { JsonLd } from "@/components/json-ld";
import { getPublishedArticles } from "@/lib/editorial";
import { absoluteUrl, breadcrumbSchema, collectionPageSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog coupon e strategie SEO",
  description:
    "Guide, approfondimenti e contenuti evergreen su coupon, merchant, monitoraggio offerte e posizionamento organico.",
  alternates: {
    canonical: "/blog"
  }
};

export default async function BlogPage() {
  const articles = await getPublishedArticles("blog");

  return (
    <div className="container section">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Blog", url: absoluteUrl("/blog") }
          ]),
          collectionPageSchema({
            title: "Blog coupon e strategie SEO",
            description: "Guide evergreen per coupon, merchant, contenuti editoriali e search optimization.",
            url: absoluteUrl("/blog"),
            itemUrls: articles.map((article) => absoluteUrl(`/blog/${article.slug}`))
          })
        ]}
      />
      <div className="page-heading">
        <span className="badge badge-primary">Evergreen content</span>
        <h1>Blog coupon e strategie SEO</h1>
        <p>Guide di approfondimento pensate per rafforzare autorevolezza tematica e copertura organica.</p>
      </div>
      <div className="grid grid-2">
        {articles.map((article) => (
          <EditorialCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
