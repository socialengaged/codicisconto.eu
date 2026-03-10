import type { Metadata } from "next";
import { EditorialCard } from "@/components/editorial-card";
import { JsonLd } from "@/components/json-ld";
import { getPublishedArticles } from "@/lib/editorial";
import { absoluteUrl, breadcrumbSchema, collectionPageSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "News coupon e offerte",
  description:
    "Notizie, campagne promozionali e aggiornamenti editoriali su coupon, offerte Amazon e opportunità monitorate dalla redazione.",
  alternates: {
    canonical: "/news"
  }
};

export default async function NewsPage() {
  const articles = await getPublishedArticles("news");

  return (
    <div className="container section">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "News", url: absoluteUrl("/news") }
          ]),
          collectionPageSchema({
            title: "News coupon e offerte",
            description:
              "Archivio news per coupon, campagne speciali, aggiornamenti e promozioni utili a Search, Discover e Google News.",
            url: absoluteUrl("/news"),
            itemUrls: articles.map((article) => absoluteUrl(`/news/${article.slug}`))
          })
        ]}
      />
      <div className="page-heading">
        <span className="badge badge-primary">Google News / Discover ready</span>
        <h1>News coupon e offerte</h1>
        <p>Contenuti rapidi, aggiornati e strutturati per presidiare query news e promozioni temporanee.</p>
      </div>
      <div className="grid grid-2">
        {articles.map((article) => (
          <EditorialCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
