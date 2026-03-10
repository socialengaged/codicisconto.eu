import type { Metadata } from "next";
import { OfferCard } from "@/components/offer-card";
import { searchOffers } from "@/lib/store";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Cerca coupon",
  description: "Ricerca interna per coupon, merchant e categorie."
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const results = await searchOffers(q);

  return (
    <div className="container section">
      <div className="page-heading">
        <h1>Cerca coupon e offerte</h1>
        <p>Trova rapidamente codici sconto per Amazon o altri merchant monitorati.</p>
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
