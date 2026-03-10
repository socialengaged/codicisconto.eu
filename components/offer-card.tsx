import Image from "next/image";
import Link from "next/link";
import { getExternalLinkRel } from "@/lib/link-rel";
import { getOfferDisplayDescription, getOfferDisplayTitle } from "@/lib/offer-presenter";
import type { OfferView } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function OfferCard({ offer }: { offer: OfferView }) {
  return (
    <article className="card offer-card">
      {offer.imageUrl ? (
        <a
          href={offer.trackingUrl}
          target="_blank"
          rel={getExternalLinkRel({ sponsored: true })}
          className="offer-card__image-link"
          aria-label={`Vai a ${offer.merchant.name}`}
        >
          <Image
            src={offer.imageUrl}
            alt={getOfferDisplayTitle(offer)}
            className="offer-card__image"
            width={640}
            height={400}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </a>
      ) : null}
      <div className="offer-card__meta">
        <span className="badge badge-primary">{offer.valueLabel}</span>
        <span className="badge">{offer.merchant.name}</span>
        {offer.code ? <span className="badge badge-accent">Codice {offer.code}</span> : null}
      </div>
      <h3>{getOfferDisplayTitle(offer)}</h3>
      <p>{getOfferDisplayDescription(offer)}</p>
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
            {offer.code ? "Dettaglio codice" : "Dettaglio offerta"}
          </Link>
          <a href={offer.trackingUrl} className="button" target="_blank" rel={getExternalLinkRel({ sponsored: true })}>
            Vai al sito ufficiale
          </a>
        </div>
      </div>
    </article>
  );
}
