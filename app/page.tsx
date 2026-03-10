import Link from "next/link";
import { EditorialCard } from "@/components/editorial-card";
import { JsonLd } from "@/components/json-ld";
import { OfferCard } from "@/components/offer-card";
import { getEditorialHomepageSnapshot } from "@/lib/editorial";
import { absoluteUrl, breadcrumbSchema, collectionPageSchema } from "@/lib/seo";
import { getHomepageSnapshot } from "@/lib/store";

export default async function HomePage() {
  const { featuredOffers, latestOffers, merchants, categories } = await getHomepageSnapshot();
  const { latestNews, latestGuides } = await getEditorialHomepageSnapshot();

  return (
    <div className="container">
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Home", url: absoluteUrl("/") }]),
          collectionPageSchema({
            title: "codicisconto.eu homepage",
            description: "Homepage con coupon, offerte, news e guide editoriali.",
            url: absoluteUrl("/"),
            itemUrls: [
              ...latestOffers.map((offer) => absoluteUrl(`/coupon/${offer.id}-${offer.slug}`)),
              ...latestNews.map((article) => absoluteUrl(`/news/${article.slug}`)),
              ...latestGuides.map((article) => absoluteUrl(`/blog/${article.slug}`))
            ]
          })
        ]}
      />
      <section className="hero">
        <div className="hero-grid">
          <article className="card hero-card">
            <span className="badge badge-primary">Offerte verificate e link ufficiali</span>
            <h1>Offerte, prodotti, news e guide ottimizzati per Search, Discover e merchant SEO.</h1>
            <p>
              `codicisconto.eu` combina pagine coupon, contenuti editoriali e monitoraggio promozionale per presidiare
              query commerciali, informative e campagne Amazon.
            </p>
            <div className="hero-actions">
              <Link href="/store/amazon" className="button">
                Vedi offerte Amazon
              </Link>
              <Link href="/news" className="button button-secondary">
                Leggi le news
              </Link>
            </div>
          </article>
          <aside className="card">
            <h2>Focus sito</h2>
            <div className="list">
              <div>
                <strong>SEO</strong>
                <p>Pagine store, categorie, dettaglio coupon, sitemap e robots.</p>
              </div>
              <div>
                <strong>Admin</strong>
                <p>Workflow bozza, review, pubblicazione e import pilot.</p>
              </div>
              <div>
                <strong>Affiliate</strong>
                <p>Ogni URL Amazon pubblicato riceve il tag affiliato configurato.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Ultime news editoriali</h2>
            <p className="muted">Contenuti rapidi pensati per campagne, picchi promozionali e Discover.</p>
          </div>
          <Link href="/news" className="button button-secondary">
            Tutte le news
          </Link>
        </div>
        <div className="grid grid-2">
          {latestNews.map((article) => (
            <EditorialCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Guide e blog post</h2>
            <p className="muted">Approfondimenti evergreen per rafforzare topical authority e long-tail SEO.</p>
          </div>
          <Link href="/blog" className="button button-secondary">
            Vai al blog
          </Link>
        </div>
        <div className="grid grid-2">
          {latestGuides.map((article) => (
            <EditorialCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Offerte in evidenza</h2>
            <p className="muted">Selezione prioritaria da tenere in homepage.</p>
          </div>
        </div>
        <div className="grid grid-2">
          {featuredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Ultime offerte pubblicate</h2>
            <p className="muted">Il flusso editoriale mostra solo ciò che è già stato verificato.</p>
          </div>
          <Link href="/search" className="button button-secondary">
            Cerca offerte
          </Link>
        </div>
        <div className="grid grid-2">
          {latestOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="grid grid-2">
          <article className="card">
            <h2>Negozi monitorati</h2>
            <div className="stack">
              {merchants.map((merchant) => (
                <Link key={merchant.id} href={`/store/${merchant.slug}`} className="badge">
                  {merchant.name}
                </Link>
              ))}
            </div>
          </article>
          <article className="card">
            <h2>Categorie SEO</h2>
            <div className="stack">
              {categories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`} className="badge badge-primary">
                  {category.name}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
