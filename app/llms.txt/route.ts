import { getBaseUrl } from "@/lib/seo";

export async function GET() {
  const baseUrl = getBaseUrl();
  const content = `# ${baseUrl}

> Sito editoriale e coupon hub dedicato a offerte, codici sconto, news promozionali e approfondimenti su Amazon e merchant selezionati.

## Sezioni principali
- Homepage: ${baseUrl}/
- Coupon Amazon: ${baseUrl}/store/amazon
- News editoriali: ${baseUrl}/news
- Blog guide: ${baseUrl}/blog
- Ricerca interna: ${baseUrl}/search
- Sitemap: ${baseUrl}/sitemap.xml
- News sitemap: ${baseUrl}/news-sitemap.xml
- Feed RSS: ${baseUrl}/feed.xml

## Note per agenti e motori AI
- Le pagine coupon pubblicate sono quelle editorialmente verificate.
- Le news coprono promozioni temporanee, campagne e contesto di mercato.
- I blog post sono contenuti evergreen e guide operative.
- I contenuti amministrativi e le API admin non sono pubblici.
`;

  return new Response(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
