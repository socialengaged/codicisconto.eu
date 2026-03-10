import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOfferBySlug } from "@/lib/store";
import { formatDate } from "@/lib/utils";

interface CouponPageProps {
  params: Promise<{ offer: string }>;
}

export async function generateMetadata({ params }: CouponPageProps): Promise<Metadata> {
  const { offer: offerParam } = await params;
  const offer = await getOfferBySlug(offerParam);

  if (!offer) {
    return {};
  }

  return {
    title: offer.title,
    description: offer.description,
    alternates: {
      canonical: `/coupon/${offer.id}-${offer.slug}`
    }
  };
}

export default async function CouponPage({ params }: CouponPageProps) {
  const { offer: offerParam } = await params;
  const offer = await getOfferBySlug(offerParam);

  if (!offer) {
    notFound();
  }

  return (
    <div className="container section">
      <article className="card hero-card">
        <div className="offer-card__meta">
          <span className="badge badge-primary">{offer.valueLabel}</span>
          <span className="badge">{offer.merchant.name}</span>
          {offer.code ? <span className="badge badge-accent">Codice: {offer.code}</span> : null}
        </div>
        <h1>{offer.title}</h1>
        <p>{offer.description}</p>
        <div className="grid grid-2">
          <div className="card">
            <h2>Dettagli coupon</h2>
            <p>Valido fino al {formatDate(offer.expiresAt)}.</p>
            <p>Merchant: {offer.merchant.name}</p>
            <p>Tipo: {offer.type === "coupon" ? "Codice sconto" : "Offerta diretta"}</p>
          </div>
          <div className="card">
            <h2>Azioni rapide</h2>
            <div className="stack">
              <a href={offer.trackingUrl} className="button" target="_blank" rel="noreferrer">
                Apri offerta
              </a>
              <Link href={`/store/${offer.merchant.slug}`} className="button button-secondary">
                Altri coupon {offer.merchant.name}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
