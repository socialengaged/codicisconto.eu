import type { Metadata } from "next";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, organizationSchema, siteKeywords, websiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  applicationName: SITE_NAME,
  title: {
    default: "codicisconto.eu | Coupon, offerte, news e blog SEO",
    template: "%s | codicisconto.eu"
  },
  description: SITE_DESCRIPTION,
  keywords: siteKeywords(),
  category: "shopping",
  authors: [{ name: "Redazione codicisconto.eu" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/opengraph-image",
    shortcut: "/opengraph-image",
    apple: "/opengraph-image"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [DEFAULT_OG_IMAGE]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE]
  },
  alternates: {
    canonical: "/"
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "YDv5U_ilQXKZhF8YrAXfj2zsZWQjVStSPDhLxmKX_Bw",
    other: process.env.BING_SITE_VERIFICATION
      ? {
          "msvalidate.01": process.env.BING_SITE_VERIFICATION
        }
      : undefined
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <SiteHeader />
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <strong>codicisconto.eu</strong>
            <p>
              Portale editoriale dedicato a offerte verificate, pagine merchant e contenuti utili per ricerca,
              Discover e Google News.
            </p>
            <p>
              I link commerciali e affiliati verso merchant esterni sono pubblicati con attributi SEO dedicati,
              inclusi `nofollow` e `sponsored` quando applicabile.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
