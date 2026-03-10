import { AdminShell } from "@/components/admin-shell";
import { getAdminSnapshot } from "@/lib/store";

export default async function AdminDashboardPage() {
  const { offers, importedOffers, sources, importJobs } = await getAdminSnapshot();
  const publishedOffers = offers.filter((offer) => offer.status === "published").length;
  const reviewOffers = offers.filter((offer) => offer.status === "review").length;
  const reviewImports = importedOffers.filter((offer) => offer.status === "review").length;

  return (
    <AdminShell title="Dashboard">
      <div className="admin-summary">
        <article className="card stat">
          <span className="muted">Offerte pubblicate</span>
          <strong>{publishedOffers}</strong>
        </article>
        <article className="card stat">
          <span className="muted">Offerte in revisione</span>
          <strong>{reviewOffers}</strong>
        </article>
        <article className="card stat">
          <span className="muted">Import da verificare</span>
          <strong>{reviewImports}</strong>
        </article>
        <article className="card stat">
          <span className="muted">Fonti attive</span>
          <strong>{sources.filter((source) => source.isActive).length}</strong>
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h2>Ultimi import</h2>
          <div className="list">
            {importJobs.slice(0, 5).map((job) => (
              <div key={job.id}>
                <strong>{job.status.toUpperCase()}</strong>
                <p className="muted">
                  Fonte: {sources.find((source) => source.id === job.sourceId)?.name || job.sourceId}
                </p>
                <p className="muted">
                  Nuovi record: {job.importedCount} · Warning: {job.warningCount}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>Stato progetto</h2>
          <ul>
            <li>Frontend pubblico SEO già collegato ai dati.</li>
            <li>Admin protetto con login via cookie firmato.</li>
            <li>Import manuale/cron avviabile da route API dedicata.</li>
            <li>Tracking Amazon centralizzato in un helper unico.</li>
          </ul>
        </article>
      </div>
    </AdminShell>
  );
}
