import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getArticleBySlug } from "@/lib/editorial";
import { getExternalLinkRel } from "@/lib/link-rel";
import { absoluteUrl, articleSchema, breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug("blog", slug);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.tags,
    alternates: {
      canonical: `/blog/${article.slug}`
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      url: absoluteUrl(`/blog/${article.slug}`),
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

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug("blog", slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="container section">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Blog", url: absoluteUrl("/blog") },
            { name: article.title, url: absoluteUrl(`/blog/${article.slug}`) }
          ]),
          articleSchema(article, `/blog/${article.slug}`)
        ]}
      />
      <article className="card article-shell">
        <div className="offer-card__meta">
          <span className="badge badge-primary">Blog</span>
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
          <h2>Approfondisci</h2>
          <div className="stack">
            {article.sourceUrls.map((url) => (
              <a key={url} href={url} className="button button-secondary" target="_blank" rel={getExternalLinkRel()}>
                Fonte collegata
              </a>
            ))}
            <Link href="/blog" className="button">
              Torna al blog
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
