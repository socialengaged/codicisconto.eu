import Link from "next/link";
import type { OfferView } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function OfferCard({ offer }: { offer: OfferView }) {
  return (
    <article className="card offer-card">
      <div className="offer-card__meta">
        <span className="badge badge-primary">{offer.valueLabel}</span>
        <span className="badge">{offer.merchant.name}</span>
        {offer.code ? <span className="badge badge-accent">Codice {offer.code}</span> : null}
      </div>
      <h3>{offer.title}</h3>
      <p>{offer.description}</p>
      <div className="offer-card__categories">
        {offer.categories.map((category) => (
          <span key={category.id} className="category-pill">
            {category.name}
          </span>
        ))}
      </div>
      <div className="offer-card__footer">
        <small>Scade: {formatDate(offer.expiresAt)}</small>
        <div className="offer-card__actions">
          <Link href={`/coupon/${offer.id}-${offer.slug}`} className="button button-secondary">
            Dettaglio
          </Link>
          <a href={offer.trackingUrl} className="button" target="_blank" rel="noreferrer">
            Vai all&apos;offerta
          </a>
        </div>
      </div>
    </article>
  );
}
