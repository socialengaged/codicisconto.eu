import type { Route } from "next";
import Link from "next/link";
import type { EditorialArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function EditorialCard({ article }: { article: EditorialArticle }) {
  const href = (article.type === "news" ? `/news/${article.slug}` : `/blog/${article.slug}`) as Route;

  return (
    <article className="card offer-card">
      <div className="offer-card__meta">
        <span className="badge badge-primary">{article.type === "news" ? "News" : "Blog"}</span>
        <span className="badge">{formatDate(article.publishedAt)}</span>
      </div>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <div className="offer-card__categories">
        {article.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="category-pill">
            {tag}
          </span>
        ))}
      </div>
      <div className="offer-card__footer">
        <small>{article.authorName}</small>
        <Link href={href} className="button button-secondary">
          Leggi articolo
        </Link>
      </div>
    </article>
  );
}
