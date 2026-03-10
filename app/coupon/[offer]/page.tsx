import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getExternalLinkRel } from "@/lib/link-rel";
import { getOfferDisplayDescription, getOfferDisplayTitle } from "@/lib/offer-presenter";
import { absoluteUrl, breadcrumbSchema, offerSchema } from "@/lib/seo";
import { getOfferBySlug } from "@/lib/store";
import type { OfferView } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface CouponPageProps {
  params: Promise<{ offer: string }>;
}

function getOfferKindLabel(hasCode: boolean): string {
  return hasCode ? "Codice sconto verificato" : "Offerta attiva senza codice";
}

function getOfficialCtaLabel(hasCode: boolean): string {
  return hasCode ? "Vai al sito ufficiale e usa il codice" : "Vai al sito ufficiale";
}

function buildOfferSummary(offer: OfferView): string {
  const categories = offer.categories.map((item) => item.name).join(", ");
  const offerKind = offer.code ? "un codice sconto da applicare in fase di acquisto" : "una promozione attiva senza codice";

  return `${getOfferDisplayTitle(offer)} riguarda ${offer.merchant.name} e segnala ${offer.valueLabel.toLowerCase()} con ${offerKind}. ${
    categories ? `La promozione e rilevante soprattutto per le categorie ${categories}.` : ""
  } Questa pagina raccoglie le informazioni utili e rimanda direttamente al sito ufficiale del merchant.`;
}

export async function generateMetadata({ params }: CouponPageProps): Promise<Metadata> {
  const { offer: offerParam } = await params;
  const offer = await getOfferBySlug(offerParam);

  if (!offer) {
    return {};
  }

  return {
    title: getOfferDisplayTitle(offer),
    description: buildOfferSummary(offer),
    keywords: [
      offer.merchant.name,
      ...offer.categories.map((item) => item.name),
      offer.code ? "codice sconto" : "offerta ufficiale",
      "promozione",
      offer.code || ""
    ].filter(Boolean),
    alternates: {
      canonical: `/coupon/${offer.id}-${offer.slug}`
    },
    openGraph: {
      type: "website",
      title: getOfferDisplayTitle(offer),
      description: getOfferDisplayDescription(offer),
      url: absoluteUrl(`/coupon/${offer.id}-${offer.slug}`),
      images: offer.imageUrl ? [{ url: offer.imageUrl, alt: getOfferDisplayTitle(offer) }] : undefined
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
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: offer.merchant.name, url: absoluteUrl(`/store/${offer.merchant.slug}`) },
            { name: getOfferDisplayTitle(offer), url: absoluteUrl(`/coupon/${offer.id}-${offer.slug}`) }
          ]),
          offerSchema(offer)
        ]}
      />
      <article className="card hero-card">
        {offer.imageUrl ? (
          <Image
            src={offer.imageUrl}
            alt={getOfferDisplayTitle(offer)}
            className="offer-hero__image"
            width={1200}
            height={675}
            sizes="(max-width: 768px) 100vw, 1120px"
            priority
          />
        ) : null}
        <div className="offer-card__meta">
          <span className="badge badge-primary">{offer.valueLabel}</span>
          <span className="badge">{offer.merchant.name}</span>
          {offer.code ? <span className="badge badge-accent">Codice: {offer.code}</span> : null}
        </div>
        <h1>{getOfferDisplayTitle(offer)}</h1>
        <p>{buildOfferSummary(offer)}</p>
        <div className="grid grid-2">
          <div className="card">
            <h2>Panoramica promozione</h2>
            <p>Tipologia: {getOfferKindLabel(Boolean(offer.code))}</p>
            <p>Valore segnalato: {offer.valueLabel}</p>
            <p>Validita: {formatDate(offer.expiresAt)}</p>
            <p>Merchant ufficiale: {offer.merchant.name}</p>
          </div>
          <div className="card">
            <h2>Azioni rapide</h2>
            <div className="stack">
              <a href={offer.trackingUrl} className="button" target="_blank" rel={getExternalLinkRel({ sponsored: true })}>
                {getOfficialCtaLabel(Boolean(offer.code))}
              </a>
              <Link href={`/store/${offer.merchant.slug}`} className="button button-secondary">
                Altre offerte di {offer.merchant.name}
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-2">
          <div className="card">
            <h2>Come sfruttare questa offerta</h2>
            {offer.code ? (
              <>
                <p>Apri il sito ufficiale di {offer.merchant.name}, aggiungi i prodotti di interesse e usa il codice <strong>{offer.code}</strong> se previsto al checkout.</p>
                <p>Controlla eventuali limiti su categorie, soglia minima e data di scadenza prima di completare l&apos;ordine.</p>
              </>
            ) : (
              <>
                <p>Apri il sito ufficiale di {offer.merchant.name} per verificare la promozione attiva e le eventuali condizioni di acquisto.</p>
                <p>Non essendoci un codice da copiare, questa pagina mostra solo i dettagli utili e il collegamento diretto al merchant.</p>
              </>
            )}
          </div>
          <div className="card">
            <h2>Informazioni utili</h2>
            <p>{getOfferDisplayDescription(offer)}</p>
            {offer.categories.length ? <p>Categorie coinvolte: {offer.categories.map((item) => item.name).join(", ")}.</p> : null}
            <p>Il collegamento esterno punta al sito ufficiale del merchant, non a portali terzi di coupon.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
