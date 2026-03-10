import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="card hero-card">
        <span className="badge badge-warning">404</span>
        <h1>Pagina non trovata</h1>
        <p>Il contenuto richiesto non esiste o non e ancora stato pubblicato.</p>
        <Link href="/" className="button">
          Torna alla homepage
        </Link>
      </div>
    </div>
  );
}
