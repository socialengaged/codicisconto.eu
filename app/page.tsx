import Link from "next/link";
import { OfferCard } from "@/components/offer-card";
import { getHomepageSnapshot } from "@/lib/store";

export default async function HomePage() {
  const { featuredOffers, latestOffers, merchants, categories } = await getHomepageSnapshot();

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-grid">
          <article className="card hero-card">
            <span className="badge badge-primary">MVP pronto per il deploy</span>
            <h1>Coupon Amazon, offerte verificate e link affiliati già pronti.</h1>
            <p>
              `codicisconto.eu` nasce per aggregare codici sconto da fonti pubbliche, farli passare in revisione
              editoriale e pubblicarli in pagine SEO pulite.
            </p>
            <div className="hero-actions">
              <Link href="/store/amazon" className="button">
                Vedi coupon Amazon
              </Link>
              <Link href="/admin/imports" className="button button-secondary">
                Gestisci import
              </Link>
            </div>
          </article>
          <aside className="card">
            <h2>Focus MVP</h2>
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
            Cerca coupon
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
