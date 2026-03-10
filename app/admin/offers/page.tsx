import { AdminShell } from "@/components/admin-shell";
import { getAdminSnapshot } from "@/lib/store";

export default async function AdminOffersPage() {
  const { offers, merchants, categories } = await getAdminSnapshot();

  return (
    <AdminShell title="Offerte">
      <div className="grid grid-2">
        <form action="/api/admin/offers" method="post" className="card grid">
          <h2>Inserisci offerta manuale</h2>
          <div className="field">
            <label htmlFor="title">Titolo</label>
            <input id="title" name="title" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="description">Descrizione</label>
            <textarea id="description" name="description" className="textarea" required />
          </div>
          <div className="form-grid grid grid-2">
            <div className="field">
              <label htmlFor="merchantId">Merchant</label>
              <select id="merchantId" name="merchantId" className="select" required defaultValue={merchants[0]?.id}>
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="type">Tipo</label>
              <select id="type" name="type" className="select" defaultValue="coupon">
                <option value="coupon">Coupon</option>
                <option value="deal">Deal</option>
              </select>
            </div>
          </div>
          <div className="form-grid grid grid-2">
            <div className="field">
              <label htmlFor="valueLabel">Etichetta valore</label>
              <input id="valueLabel" name="valueLabel" className="input" placeholder="-20% o 10 euro" required />
            </div>
            <div className="field">
              <label htmlFor="code">Codice</label>
              <input id="code" name="code" className="input" placeholder="opzionale" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="destinationUrl">URL destinazione</label>
            <input id="destinationUrl" name="destinationUrl" className="input" type="url" required />
          </div>
          <div className="form-grid grid grid-2">
            <div className="field">
              <label htmlFor="categoryIds">Categorie</label>
              <select id="categoryIds" name="categoryIds" className="select" multiple size={Math.min(categories.length, 4)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Stato iniziale</label>
              <select id="status" name="status" className="select" defaultValue="review">
                <option value="draft">Bozza</option>
                <option value="review">Review</option>
                <option value="published">Pubblicata</option>
              </select>
            </div>
          </div>
          <button type="submit" className="button">
            Salva offerta
          </button>
        </form>

        <article className="card">
          <h2>Workflow editoriale</h2>
          <ul>
            <li>Inserimento manuale o import da fonti pubbliche.</li>
            <li>Review editoriale prima della pubblicazione.</li>
            <li>Tracking Amazon automatico in pubblicazione.</li>
            <li>Scadenze e stati modificabili dalla tabella qui sotto.</li>
          </ul>
        </article>
      </div>

      <div className="card table-wrap">
        <h2>Catalogo offerte</h2>
        <table>
          <thead>
            <tr>
              <th>Titolo</th>
              <th>Merchant</th>
              <th>Stato</th>
              <th>Coupon</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <strong>{offer.title}</strong>
                  <div className="muted">{offer.valueLabel}</div>
                </td>
                <td>{offer.merchant.name}</td>
                <td>{offer.status}</td>
                <td>{offer.code || "-"}</td>
                <td>
                  <div className="inline-form">
                    {offer.status !== "published" ? (
                      <form action={`/api/admin/offers/${offer.id}`} method="post">
                        <input type="hidden" name="status" value="published" />
                        <button className="button" type="submit">
                          Pubblica
                        </button>
                      </form>
                    ) : null}
                    {offer.status !== "review" ? (
                      <form action={`/api/admin/offers/${offer.id}`} method="post">
                        <input type="hidden" name="status" value="review" />
                        <button className="button button-secondary" type="submit">
                          Review
                        </button>
                      </form>
                    ) : null}
                    {offer.status !== "expired" ? (
                      <form action={`/api/admin/offers/${offer.id}`} method="post">
                        <input type="hidden" name="status" value="expired" />
                        <button className="button button-danger" type="submit">
                          Scaduta
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
