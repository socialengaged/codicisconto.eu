import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login admin",
  description: "Accesso all'area di revisione coupon."
};

export default function AdminLoginPage() {
  return (
    <div className="container section">
      <div className="grid" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="page-heading">
          <span className="badge badge-primary">Area riservata</span>
          <h1>Login admin</h1>
          <p>Usa le credenziali configurate nel file `.env.local` per accedere alla dashboard.</p>
        </div>
        <form action="/api/admin/login" method="post" className="card grid">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input className="input" id="username" name="username" defaultValue="admin" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required />
          </div>
          <button type="submit" className="button">
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}
