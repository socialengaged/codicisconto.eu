import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, breadcrumbSchema, collectionPageSchema } from "@/lib/seo";
import { OfferCard } from "@/components/offer-card";
import { searchOffers } from "@/lib/store";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q = "" } = await searchParams;
  const normalizedQuery = q.trim();

  if (!normalizedQuery) {
    return {
      title: "Cerca offerte",
      description: "Ricerca interna per offerte, merchant e categorie.",
      keywords: ["ricerca offerte", "coupon", "merchant", "categorie"],
      alternates: {
        canonical: "/search"
      }
    };
  }

  return {
    title: `Risultati ricerca per ${normalizedQuery}`,
    description: `Risultati di ricerca interni per ${normalizedQuery} tra offerte, coupon e merchant monitorati.`,
    keywords: [normalizedQuery, `${normalizedQuery} offerte`, `${normalizedQuery} coupon`, "ricerca interna"],
    alternates: {
      canonical: `/search?q=${encodeURIComponent(normalizedQuery)}`
    },
    openGraph: {
      title: `Risultati ricerca per ${normalizedQuery}`,
      description: `Risultati di ricerca interni per ${normalizedQuery} tra offerte, coupon e merchant monitorati.`,
      url: absoluteUrl(`/search?q=${encodeURIComponent(normalizedQuery)}`)
    }
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const results = await searchOffers(q);
  const normalizedQuery = q.trim();

  return (
    <div className="container section">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Cerca offerte", url: absoluteUrl(normalizedQuery ? `/search?q=${encodeURIComponent(normalizedQuery)}` : "/search") }
          ]),
          collectionPageSchema({
            title: normalizedQuery ? `Risultati ricerca per ${normalizedQuery}` : "Ricerca offerte",
            description: normalizedQuery
              ? `Risultati di ricerca interni per ${normalizedQuery} tra offerte e promozioni attive.`
              : "Pagina di ricerca interna per offerte, merchant e categorie del catalogo.",
            url: absoluteUrl(normalizedQuery ? `/search?q=${encodeURIComponent(normalizedQuery)}` : "/search"),
            itemUrls: results.map((offer) => absoluteUrl(`/coupon/${offer.id}-${offer.slug}`))
          })
        ]}
      />
      <div className="page-heading">
        <h1>Cerca offerte e promozioni</h1>
        <p>Trova rapidamente promozioni attive, codici sconto reali e merchant monitorati.</p>
      </div>

      <form className="card inline-form" method="get">
        <input className="input" type="search" name="q" defaultValue={q} placeholder="es. smart home, Prime, cucina" />
        <button className="button" type="submit">
          Cerca
        </button>
      </form>

      <section className="section">
        {q ? (
          <p className="muted">
            {results.length} risultati per <strong>{q}</strong>
          </p>
        ) : (
          <p className="muted">Inserisci una parola chiave per cercare nel catalogo pubblicato.</p>
        )}
        <div className="grid grid-2">
          {results.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>
    </div>
  );
}
