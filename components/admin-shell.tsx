import Link from "next/link";
import type { ReactNode } from "react";

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container admin-layout">
      <aside className="card admin-sidebar">
        <h2>Admin</h2>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/offers">Offerte</Link>
          <Link href="/admin/imports">Import</Link>
          <Link href="/admin/editorial">Editoriale</Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="button button-secondary full-width">
              Logout
            </button>
          </form>
        </nav>
      </aside>
      <section className="admin-content">
        <div className="page-heading">
          <h1>{title}</h1>
        </div>
        {children}
      </section>
    </div>
  );
}
