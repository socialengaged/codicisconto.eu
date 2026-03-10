import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getArticleBySlug } from "@/lib/editorial";
import { getExternalLinkRel } from "@/lib/link-rel";
import { absoluteUrl, articleSchema, breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug("news", slug);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.tags,
    alternates: {
      canonical: `/news/${article.slug}`
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      url: absoluteUrl(`/news/${article.slug}`),
      images: [absoluteUrl(article.coverImage)]
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [absoluteUrl(article.coverImage)]
    }
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug("news", slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="container section">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "News", url: absoluteUrl("/news") },
            { name: article.title, url: absoluteUrl(`/news/${article.slug}`) }
          ]),
          articleSchema(article, `/news/${article.slug}`)
        ]}
      />
      <article className="card article-shell">
        <div className="offer-card__meta">
          <span className="badge badge-primary">News</span>
          <span className="badge">{formatDate(article.publishedAt)}</span>
          <span className="badge">{article.authorName}</span>
        </div>
        <h1>{article.title}</h1>
        <p className="article-excerpt">{article.excerpt}</p>
        <div className="offer-card__categories">
          {article.tags.map((tag) => (
            <span key={tag} className="category-pill">
              {tag}
            </span>
          ))}
        </div>
        <div className="article-body">
          {article.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="card">
          <h2>Fonti e collegamenti</h2>
          <div className="stack">
            {article.sourceUrls.map((url) => (
              <a key={url} href={url} className="button button-secondary" target="_blank" rel={getExternalLinkRel()}>
                Apri fonte
              </a>
            ))}
            <Link href="/news" className="button">
              Torna alle news
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
