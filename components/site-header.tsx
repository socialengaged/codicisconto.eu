import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-row">
        <Link href="/" className="brand">
          codicisconto.eu
        </Link>
        <nav className="nav-links" aria-label="Navigazione principale">
          <Link href="/">Home</Link>
          <Link href="/store/amazon">Amazon</Link>
          <Link href="/news">News</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/search">Cerca</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
