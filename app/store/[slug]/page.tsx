import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferCard } from "@/components/offer-card";
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
    title: `${data.merchant.name} coupon e offerte`,
    description: data.merchant.description,
    alternates: {
      canonical: `/store/${data.merchant.slug}`
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
