import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferCard } from "@/components/offer-card";
import { getCategoryBySlug } from "@/lib/store";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);

  if (!data) {
    return {};
  }

  return {
    title: `${data.category.name} coupon e sconti`,
    description: data.category.description,
    alternates: {
      canonical: `/category/${data.category.slug}`
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="container section">
      <div className="page-heading">
        <span className="badge badge-primary">Categoria SEO</span>
        <h1>{data.category.name}</h1>
        <p>{data.category.description}</p>
      </div>
      <div className="grid grid-2">
        {data.offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
