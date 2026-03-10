import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { OfferCard } from "@/components/offer-card";
import { absoluteUrl, breadcrumbSchema, collectionPageSchema } from "@/lib/seo";
import { getStoreBySlug } from "@/lib/store";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStoreBySlug(slug);

  if (!data) {
    return {};
  }

  return {
    title: `${data.merchant.name} offerte e promozioni ufficiali`,
    description: data.merchant.description,
    keywords: [data.merchant.name, "offerte", "promozioni", "sito ufficiale"],
    alternates: {
      canonical: `/store/${data.merchant.slug}`
    },
    openGraph: {
      title: `${data.merchant.name} offerte e promozioni ufficiali`,
      description: data.merchant.description,
      url: absoluteUrl(`/store/${data.merchant.slug}`)
    }
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const data = await getStoreBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="container section">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: data.merchant.name, url: absoluteUrl(`/store/${data.merchant.slug}`) }
          ]),
          collectionPageSchema({
            title: `${data.merchant.name} offerte e promozioni ufficiali`,
            description: data.merchant.description,
            url: absoluteUrl(`/store/${data.merchant.slug}`),
            itemUrls: data.offers.map((offer) => absoluteUrl(`/coupon/${offer.id}-${offer.slug}`))
          })
        ]}
      />
      <div className="page-heading">
        <span className="badge badge-primary">Store page SEO</span>
        <h1>{data.merchant.name}</h1>
        <p>{data.merchant.description}</p>
      </div>
      <div className="grid grid-2">
        {data.offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
