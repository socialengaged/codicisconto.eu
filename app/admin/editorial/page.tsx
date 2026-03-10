import { AdminShell } from "@/components/admin-shell";
import { readEditorialStore } from "@/lib/editorial";
import { getPublishedOffers } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default async function AdminEditorialPage() {
  const offers = await getPublishedOffers();
  const editorialStore = await readEditorialStore();
  const articles = [...editorialStore.articles].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );

  return (
    <AdminShell title="Editoriale">
      <div className="grid grid-2">
        <form action="/api/admin/editorial/generate" method="post" className="card grid">
          <h2>Genera bozza con API / fallback</h2>
          <p className="muted">
            Se `OPENAI_API_KEY` è presente, la bozza viene arricchita via API. In assenza della chiave viene generata
            una bozza locale a partire dalle offerte pubblicate.
          </p>
          <div className="field">
            <label htmlFor="topic">Topic editoriale</label>
            <input
              id="topic"
              name="topic"
              className="input"
              placeholder="es. Amazon coupon marzo, Prime Day, offerte casa"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="type">Tipo contenuto</label>
            <select id="type" name="type" className="select" defaultValue="news">
              <option value="news">News</option>
              <option value="blog">Blog</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="offerIds">Offerte sorgente</label>
            <select id="offerIds" name="offerIds" className="select" multiple size={Math.min(offers.length, 8)}>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.merchant.name} · {offer.title}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button">
            Genera bozza
          </button>
        </form>

        <article className="card">
          <h2>Obiettivo SEO editoriale</h2>
          <ul>
            <li>News veloci per campagne promozionali e picchi stagionali.</li>
            <li>Blog evergreen per guide, glossario e how-to sui coupon.</li>
            <li>Structured data `Article` e `NewsArticle` per supportare Search e Discover.</li>
            <li>Bozze sempre da revisionare prima della pubblicazione editoriale.</li>
          </ul>
        </article>
      </div>

      <div className="card table-wrap">
        <h2>Archivio editoriale pubblicato</h2>
        <table>
          <thead>
            <tr>
              <th>Titolo</th>
              <th>Tipo</th>
              <th>Stato</th>
              <th>Data</th>
              <th>Topic</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>
                  <strong>{article.title}</strong>
                  <div className="muted">{article.excerpt}</div>
                </td>
                <td>{article.type}</td>
                <td>{article.status}</td>
                <td>{formatDate(article.publishedAt)}</td>
                <td>{article.topic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
