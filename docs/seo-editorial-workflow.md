# SEO e workflow editoriale

Questo progetto ora separa due livelli:

- SEO tecnico del sito coupon
- contenuti editoriali per `Search`, `Discover` e `Google News`

## SEO tecnico gia implementato

- metadata globali piu completi in `app/layout.tsx`
- `Open Graph` e `Twitter card`
- JSON-LD per:
  - `Organization`
  - `WebSite`
  - `BreadcrumbList`
  - `CollectionPage`
  - `Offer`
  - `Article` / `NewsArticle`
- `manifest.webmanifest`
- `robots.txt`
- `sitemap.xml`
- `news-sitemap.xml`
- `feed.xml`
- `llms.txt`
- immagini OG dinamiche per home, news e blog

## Sezioni editoriali

- `news/` per promozioni temporanee, campagne e contenuti freschi
- `blog/` per guide evergreen e approfondimenti

## Fonti dati editoriali

- coupon e offerte: `data/store.json`
- articoli editoriali: `data/editorial.json`

## Generazione contenuti con API

Route disponibile:

- `POST /api/admin/editorial/generate`

La route:

1. legge le offerte pubblicate
2. costruisce un contesto editoriale
3. se `OPENAI_API_KEY` e presente, chiama l'API OpenAI
4. se la chiave non e presente, genera una bozza locale di fallback
5. salva il risultato in `data/editorial.json` come `draft`

## Variabili ambiente utili

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
```

## Regole editoriali consigliate

- pubblicare solo contenuti verificati e realmente utili
- evitare testi generici o keyword stuffing
- per le news: puntare su rapidita, chiarezza e data esplicita
- per il blog: puntare su evergreen, guide, comparazioni e intent informativo
- ogni articolo AI deve essere revisionato prima della pubblicazione

## Limiti realistici

Queste ottimizzazioni aiutano molto, ma non garantiscono automaticamente:

- inclusione in Google News
- visibilita in Discover
- ranking top immediato

Per performare davvero servono anche:

- frequenza editoriale costante
- contenuti originali e aggiornati
- immagini forti per CTR e Discover
- collegamenti interni coerenti
- buon profilo di trust e segnali di qualita nel tempo
