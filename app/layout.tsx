import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "codicisconto.eu | Coupon Amazon e offerte verificate",
    template: "%s | codicisconto.eu"
  },
  description:
    "Sito coupon orientato ad Amazon con link affiliati, import da fonti pubbliche e revisione editoriale manuale.",
  openGraph: {
    title: "codicisconto.eu",
    description: "Coupon Amazon e offerte verificate con struttura SEO pronta per la produzione.",
    siteName: "codicisconto.eu",
    locale: "it_IT",
    type: "website"
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <strong>codicisconto.eu</strong>
            <p>
              MVP locale per aggregare coupon e offerte Amazon con revisione editoriale e tracking affiliato.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
