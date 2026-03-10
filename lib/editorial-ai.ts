import { z } from "zod";
import { buildArticleDraftFromOffers, readEditorialStore, writeEditorialStore } from "@/lib/editorial";
import { getPublishedOffers } from "@/lib/store";
import type { EditorialArticle, EditorialArticleType } from "@/lib/types";
import { slugify } from "@/lib/utils";

const articleDraftSchema = z.object({
  title: z.string().min(10),
  excerpt: z.string().min(30),
  content: z.array(z.string().min(30)).min(3),
  tags: z.array(z.string().min(2)).min(3).max(8)
});

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function buildOfferContext(offers: Awaited<ReturnType<typeof getPublishedOffers>>) {
  return offers.map((offer) => ({
    id: offer.id,
    merchant: offer.merchant.name,
    title: offer.title,
    description: offer.description,
    code: offer.code,
    valueLabel: offer.valueLabel,
    expiresAt: offer.expiresAt,
    categories: offer.categories.map((item) => item.name),
    url: offer.destinationUrl
  }));
}

async function generateWithOpenAI(input: {
  type: EditorialArticleType;
  topic: string;
  offerIds?: string[];
}): Promise<z.infer<typeof articleDraftSchema>> {
  const offers = await getPublishedOffers();
  const selectedOffers =
    input.offerIds && input.offerIds.length > 0
      ? offers.filter((offer) => input.offerIds?.includes(offer.id))
      : offers.slice(0, 5);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sei un editor SEO italiano specializzato in coupon, merchant e news promozionali. Produci contenuti utili, originali, concreti e strutturati. Rispondi solo in JSON valido con le chiavi: title, excerpt, content, tags."
        },
        {
          role: "user",
          content: JSON.stringify({
            requestedType: input.type,
            topic: input.topic,
            requirements: [
              "Scrivi in italiano naturale",
              "Evita claim non verificabili",
              "Spiega contesto, condizioni e utilita",
              "Niente tono spam o keyword stuffing",
              "3-5 paragrafi corposi"
            ],
            offers: buildOfferContext(selectedOffers)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawContent = payload.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("OpenAI API returned an empty response.");
  }

  return articleDraftSchema.parse(JSON.parse(rawContent));
}

export async function generateEditorialDraft(input: {
  type: EditorialArticleType;
  topic: string;
  offerIds?: string[];
}): Promise<EditorialArticle> {
  const store = await readEditorialStore();
  const fallbackDraft = await buildArticleDraftFromOffers({
    type: input.type,
    topic: input.topic,
    title: `${input.topic} | ${input.type === "news" ? "News" : "Guida"}`
  });

  let article = fallbackDraft;

  if (process.env.OPENAI_API_KEY) {
    const aiDraft = await generateWithOpenAI(input);
    const now = new Date().toISOString();
    article = {
      ...fallbackDraft,
      slug: slugify(aiDraft.title),
      title: aiDraft.title,
      excerpt: aiDraft.excerpt,
      content: aiDraft.content,
      tags: aiDraft.tags,
      updatedAt: now
    };
  }

  store.articles.unshift(article);
  await writeEditorialStore(store);
  return article;
}
