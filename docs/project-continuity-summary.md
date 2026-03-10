# Stato Progetto `codicisconto.eu`

## Obiettivo attuale

Costruire un sito coupon/offerte migliore dei competitor in usabilita, velocita, mobile UX e SEO, con:

- pagine piu utili e parlanti
- link sempre verso merchant ufficiali
- scraping separato per siti web e Telegram
- pipeline editoriale pronta per contenuti AI in una fase successiva

## Stato live

- Dominio live: `https://codicisconto.eu`
- App: `Next.js App Router`
- Dati runtime: `data/store.json`
- Server app: `next start` su porta `3005`
- Reverse proxy: `nginx`
- Servizio: `codicisconto-eu.service`

## Stato funzionale raggiunto

### Frontend pubblico

- homepage live con offerte in evidenza, ultime offerte, news e blog
- store page merchant
- category page
- dettaglio offerta
- ricerca interna
- feed, sitemap, robots, news sitemap, OG image, JSON-LD

### Regole attuali di pubblicazione

- i link esterni devono puntare a siti ufficiali merchant
- i portali coupon non devono essere usati come destinazione pubblica
- il badge `Codice ...` compare solo se esiste un codice reale
- le offerte senza codice vengono presentate come promo/offerte e non come coupon da copiare

### Qualita UI/UX gia sistemata

- link `Admin` rimosso dall'header pubblico
- badge hero non piu in stile MVP tecnico
- navigazione header piu ordinata su mobile
- ricerca con layout migliore su viewport stretti
- titoli Telegram troppo promozionali ripuliti a livello di rendering
- immagini prodotto recuperabili dalle pagine ufficiali e mostrate su card/dettaglio
- tassonomia categorie ampliata per creare pagine category piu solide lato SEO

## Scraping attuale

## 1. Scraping siti web

Cartella principale:

- `lib/import/`
- `lib/import/sources/generic-html.ts`
- `lib/import/extract.ts`
- `lib/import/source-presets.ts`

Uso:

- parsing euristico HTML
- normalizzazione merchant
- pulizia falsi codici
- trasformazione link verso merchant ufficiali

Fonti gia usate con risultati utili:

- `Discoup`
- `TopNegozi`
- `Sconti.com`
- `Codice Risparmio`
- alcune landing verticali su merchant specifici

Limite noto:

- molti competitor non espongono il codice reale in HTML statico
- spesso si ottiene una promo strutturata, non un coupon copiabile

## 2. Scraping Telegram separato

Cartella dedicata:

- `lib/import/telegram/`

File principali:

- `lib/import/telegram/presets.ts`
- `lib/import/telegram/extract-public.ts`
- `lib/import/telegram/adapter.ts`

Integrazione:

- `SourceKind`: `telegramPublic`
- bootstrap dedicato: `app/api/admin/import/bootstrap-telegram/route.ts`

Fonti attive:

- `https://t.me/s/Migliori_Sconti`
- `https://t.me/s/CODICISCONT0`

### Comportamento attuale dei 2 canali

#### `CODICISCONT0`

- canale molto utile
- la preview pubblica espone spesso link Amazon diretti
- i migliori post vengono importati e pubblicati in modo semi-automatico
- i post multi-prodotto con piu link Amazon ora possono essere splittati in piu offerte distinte
- stato corrente: 12 offerte Amazon pubblicate da questa fonte, con pipeline pronta per arricchimento immagini ufficiali

#### `Migliori_Sconti`

- canale piu rumoroso
- spesso mostra testo promo + link a portale coupon intermedio
- adesso e separato e piu filtrato
- resta principalmente in `review`, non in autopubblicazione

### Limite tecnico Telegram attuale

Questa prima versione usa la preview pubblica `t.me/s/...`.

Vantaggi:

- nessun login Telegram necessario
- nessuna sessione MTProto necessaria
- rapido da mantenere

Limiti:

- copertura parziale della cronologia
- dipendenza dal markup della preview pubblica
- niente canali privati
- niente messaggi non accessibili via preview

## Funzioni admin utili

Area import:

- `POST /api/admin/import/bootstrap`
  - sincronizza fonti web consigliate
  - importa
  - pubblica i migliori risultati

- `POST /api/admin/import/bootstrap-telegram`
  - sincronizza fonti Telegram
  - svuota la coda Telegram in review
  - reimporta i post recenti
  - pubblica i migliori post Amazon di `CODICISCONT0`

- `POST /api/admin/import/cleanup`
  - ripulisce merchant, codici e destinazioni ufficiali gia presenti nel dataset

- `POST /api/admin/import/enrich`
  - arricchisce le offerte pubblicate con immagini ufficiali e categorie SEO derivate

### Cron produzione

Script server-side installati:

- `scripts/run-daily-imports.sh`
- `scripts/install-daily-cron.sh`

Cron attivo in produzione:

- `25 3 * * * /home/ubuntu/apps/codicisconto.eu/scripts/run-daily-imports.sh >> /home/ubuntu/apps/codicisconto.eu/logs/daily-imports.log 2>&1`

Flusso eseguito dal job:

- bootstrap fonti web consigliate
- bootstrap Telegram
- cleanup merchant/codici/link
- enrich immagini ufficiali e categorie SEO

## Stato dati dopo gli ultimi interventi

Situazione attesa in produzione:

- catalogo con offerte web + Amazon Telegram
- `CODICISCONT0` alimenta il catalogo Amazon
- `Migliori_Sconti` alimenta review filtrata
- homepage e store `Amazon` mostrano anche offerte prodotto importate da Telegram

## File chiave da conoscere

### Presentazione frontend

- `app/page.tsx`
- `app/store/[slug]/page.tsx`
- `app/coupon/[offer]/page.tsx`
- `app/search/page.tsx`
- `components/offer-card.tsx`
- `components/site-header.tsx`
- `app/globals.css`

### Dati e normalizzazione

- `lib/store.ts`
- `lib/category-presets.ts`
- `lib/offer-presenter.ts`
- `lib/offer-enrichment.ts`
- `lib/merchant-official.ts`
- `lib/import/extract.ts`

### SEO/editoriale

- `lib/seo.ts`
- `lib/editorial.ts`
- `lib/editorial-ai.ts`
- `docs/seo-editorial-workflow.md`

## Problemi ancora aperti

### 1. Mobile navigation

Il sito e gia usabile su mobile, ma manca ancora:

- menu hamburger
- UX mobile piu rifinita per header e navigazione

### 2. Performance e arricchimento schede

Possibili prossimi miglioramenti:

- dati prezzo precedente / percentuale risparmio normalizzata
- specifiche prodotto piu strutturate
- eventuale caching locale delle immagini ufficiali recuperate
- eventuale caching dei contenuti importati
- ulteriore rifinitura dei titoli `Offerta` troppo generici per alcuni item Amazon splittati

## Prossimi step consigliati

### Priorita alta

1. Aggiungere immagini prodotto alle offerte Amazon Telegram
2. Distinguere meglio in homepage:
   - coupon con codice
   - offerte prodotto
   - promozioni merchant
3. Rafforzare category hub e link interni tra categorie affini

### Priorita media

1. Generare contenuti editoriali AI usando i nuovi item Telegram/Amazon
2. Inserire widget o sezioni tematiche:
   - tech
   - casa
   - beauty
   - gaming
3. Migliorare ulteriormente mobile nav

### Priorita strategica

1. Se serve scraping Telegram piu profondo, valutare integrazione con la connessione gia presente sul server per Nemira/Telegram
2. Passare da JSON store a database relazionale per scalare import, immagini, storico prezzi e deduplica avanzata

## Note operative importanti

- non pubblicare link a portali coupon come CTA pubbliche
- usare i portali coupon solo come fonte informativa, mai come destinazione finale
- tenere `Migliori_Sconti` in review forte
- usare `CODICISCONT0` come motore principale Amazon finche resta pubblico e stabile
- non inserire segreti in questo file

## Comandi/azioni tipiche per ripartire

### Import web

- usare il pulsante admin relativo alle fonti web

### Import Telegram

- usare il pulsante admin relativo a Telegram

### Cleanup dataset

- usare il pulsante admin `Ripulisci merchant e codici gia importati`

### Verifica rapida live

Controllare almeno:

- `/`
- `/store/amazon`
- una detail page Amazon importata da Telegram
- una detail page merchant senza codice
- `/search?q=philips`

## Sintesi finale

Il progetto e gia oltre una semplice vetrina coupon:

- ha scraping multi-fonte
- ha SEO tecnico completo
- ha sezione editoriale
- ha pipeline Telegram separata
- ha CTA ufficiali pulite
- ha un catalogo Amazon ora alimentato anche da Telegram
- ha immagini prodotto e category SEO arricchite a livello dati

La prossima leva di vantaggio competitivo piu forte e:

- qualità editoriale automatica
- UX mobile piu premium
- piu struttura dati per le schede offerta
