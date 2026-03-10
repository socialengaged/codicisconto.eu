import { AdminShell } from "@/components/admin-shell";
import { formatDateTime } from "@/lib/utils";
import { getAdminSnapshot } from "@/lib/store";

export default async function AdminImportsPage() {
  const { importedOffers, sources, importJobs } = await getAdminSnapshot();

  return (
    <AdminShell title="Import da fonti pubbliche">
      <div className="grid grid-2">
        <article className="card">
          <h2>Esegui import</h2>
          <p className="muted">
            Lancia manualmente la pipeline. Le fonti `fixture` servono per verificare il workflow locale; le
            `genericHtml` vanno configurate con una sorgente pubblica reale.
          </p>
          <form action="/api/import/run" method="post" className="grid">
            <div className="field">
              <label htmlFor="sourceId">Fonte</label>
              <select id="sourceId" name="sourceId" className="select" defaultValue="">
                <option value="">Tutte le fonti attive</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} · {source.kind} · {source.isActive ? "attiva" : "disattiva"}
                  </option>
                ))}
              </select>
            </div>
            <button className="button" type="submit">
              Avvia import
            </button>
          </form>
        </article>
        <article className="card">
          <h2>Fonti configurate</h2>
          <div className="list">
            {sources.map((source) => (
              <div key={source.id}>
                <strong>{source.name}</strong>
                <p className="muted">
                  {source.kind} · {source.baseUrl}
                </p>
                <p className="muted">{source.notes}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="card table-wrap">
        <h2>Coda review</h2>
        <table>
          <thead>
            <tr>
              <th>Titolo</th>
              <th>Fonte</th>
              <th>Confidence</th>
              <th>Warning</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {importedOffers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <strong>{offer.title}</strong>
                  <div className="muted">{offer.code || "Nessun codice estratto"}</div>
                </td>
                <td>{offer.source.name}</td>
                <td>{Math.round(offer.confidenceScore * 100)}%</td>
                <td>{offer.warnings[0] || "-"}</td>
                <td>
                  {offer.status === "review" ? (
                    <form action={`/api/admin/imports/${offer.id}/publish`} method="post">
                      <button className="button" type="submit">
                        Pubblica come offerta
                      </button>
                    </form>
                  ) : (
                    <span className="badge badge-success">Gia pubblicata</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <h2>Storico job</h2>
        <table>
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Stato</th>
              <th>Avvio</th>
              <th>Nuovi</th>
              <th>Warning</th>
            </tr>
          </thead>
          <tbody>
            {importJobs.map((job) => (
              <tr key={job.id}>
                <td>{sources.find((source) => source.id === job.sourceId)?.name || job.sourceId}</td>
                <td>{job.status}</td>
                <td>{formatDateTime(job.startedAt)}</td>
                <td>{job.importedCount}</td>
                <td>{job.warningCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
