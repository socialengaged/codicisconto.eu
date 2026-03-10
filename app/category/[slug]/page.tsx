import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { OfferCard } from "@/components/offer-card";
import { absoluteUrl, breadcrumbSchema, collectionPageSchema } from "@/lib/seo";
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

  const merchantKeywords = Array.from(new Set(data.offers.map((offer) => offer.merchant.name))).slice(0, 8);

  return {
    title: `${data.category.name} offerte e sconti`,
    description: data.category.description,
    keywords: [
      data.category.name,
      `${data.category.name} offerte`,
      `${data.category.name} sconti`,
      "promozioni",
      "coupon verificati",
      ...merchantKeywords
    ],
    alternates: {
      canonical: `/category/${data.category.slug}`
    },
    openGraph: {
      title: `${data.category.name} offerte e sconti`,
      description: data.category.description,
      url: absoluteUrl(`/category/${data.category.slug}`)
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
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: data.category.name, url: absoluteUrl(`/category/${data.category.slug}`) }
          ]),
          collectionPageSchema({
            title: `${data.category.name} offerte e sconti`,
            description: data.category.description,
            url: absoluteUrl(`/category/${data.category.slug}`),
            itemUrls: data.offers.map((offer) => absoluteUrl(`/coupon/${offer.id}-${offer.slug}`))
          })
        ]}
      />
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
