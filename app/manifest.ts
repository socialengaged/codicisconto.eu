import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "codicisconto.eu",
    short_name: "codicisconto",
    description: "Coupon, news e blog post ottimizzati per Search, Discover e promozioni Amazon.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#1d4ed8",
    lang: "it-IT"
  };
}
