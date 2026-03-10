import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { SITE_AUTHOR_NAME } from "@/lib/seo";
import type { EditorialArticle, EditorialArticleType, EditorialStore, OfferView } from "@/lib/types";
import { getPublishedOffers } from "@/lib/store";
import { slugify } from "@/lib/utils";

const EDITORIAL_PATH = path.join(process.cwd(), "data", "editorial.json");

export async function readEditorialStore(): Promise<EditorialStore> {
  noStore();
  const content = await fs.readFile(EDITORIAL_PATH, "utf8");
  return JSON.parse(content) as EditorialStore;
}

export async function writeEditorialStore(store: EditorialStore): Promise<void> {
  await fs.writeFile(EDITORIAL_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function getPublishedArticles(type?: EditorialArticleType): Promise<EditorialArticle[]> {
  const store = await readEditorialStore();
  const articles = store.articles
    .filter((article) => article.status === "published")
    .filter((article) => (type ? article.type === type : true))
    .map((article) => ({
      ...article,
      authorName: article.authorName || SITE_AUTHOR_NAME
    }))
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());

  return articles;
}

export async function getArticleBySlug(type: EditorialArticleType, slug: string): Promise<EditorialArticle | undefined> {
  const articles = await getPublishedArticles(type);
  return articles.find((article) => article.slug === slug);
}

export async function getEditorialHomepageSnapshot(): Promise<{
  latestNews: EditorialArticle[];
  latestGuides: EditorialArticle[];
}> {
  const articles = await getPublishedArticles();

  return {
    latestNews: articles.filter((article) => article.type === "news").slice(0, 4),
    latestGuides: articles.filter((article) => article.type === "blog").slice(0, 4)
  };
}

function markdownParagraphsFromOffers(offers: OfferView[]): string[] {
  return offers.slice(0, 5).map((offer) => {
    const couponLabel = offer.code ? ` con codice ${offer.code}` : "";
    const categoryLabel = offer.categories.map((item) => item.name).join(", ");

    return `${offer.merchant.name} propone ${offer.title}${couponLabel}. L'offerta è collegata alle categorie ${categoryLabel || "coupon"} e punta a un vantaggio dichiarato pari a ${offer.valueLabel}.`;
  });
}

export async function buildArticleDraftFromOffers(input: {
  type: EditorialArticleType;
  title: string;
  topic: string;
  offerIds?: string[];
}): Promise<EditorialArticle> {
  const offers = await getPublishedOffers();
  const selectedOffers =
    input.offerIds && input.offerIds.length > 0
      ? offers.filter((offer) => input.offerIds?.includes(offer.id))
      : offers.slice(0, 5);

  const now = new Date().toISOString();
  const excerpt = `Bozza automatica per ${input.topic.toLowerCase()} costruita a partire dai coupon e dalle offerte pubblicate nel sito.`;

  return {
    id: `article_${slugify(input.title)}_${Date.now()}`,
    slug: slugify(input.title),
    type: input.type,
    status: "draft",
    title: input.title,
    excerpt,
    content: [
      `Questa bozza editoriale nasce dall'analisi delle offerte pubblicate su codicisconto.eu per il tema ${input.topic.toLowerCase()}.`,
      ...markdownParagraphsFromOffers(selectedOffers),
      "Prima della pubblicazione è necessario aggiungere contesto editoriale, verificare fonti e condizioni, e rifinire titolo, excerpt e sottotemi."
    ],
    coverImage: `/${input.type}/${slugify(input.title)}/opengraph-image`,
    tags: [input.topic.toLowerCase(), "coupon", "seo", "editoriale"],
    topic: input.topic,
    sourceOfferIds: selectedOffers.map((offer) => offer.id),
    sourceUrls: selectedOffers.map((offer) => offer.destinationUrl),
    authorName: SITE_AUTHOR_NAME,
    publishedAt: now,
    updatedAt: now
  };
}
