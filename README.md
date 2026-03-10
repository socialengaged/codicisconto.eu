# codicisconto.eu

MVP locale di un sito coupon orientato ad Amazon, con:

- frontend SEO in `Next.js`
- area admin protetta
- pipeline di import da siti web pubblici
- link affiliati Amazon centralizzati
- schema `Prisma` pronto per `PostgreSQL`

## Cosa c'e gia

- homepage con offerte in evidenza
- pagine store: `/store/amazon`
- pagine categoria: `/category/elettronica`
- dettaglio coupon: `/coupon/<id>-<slug>`
- ricerca interna: `/search`
- admin: `/admin`
- login admin: `/admin/login`
- route import: `/api/import/run`
- sitemap: `/sitemap.xml`
- robots: `/robots.txt`

Il progetto usa un archivio locale in `data/store.json` per rendere subito il sito navigabile in locale.
In parallelo e presente anche `prisma/schema.prisma` per il passaggio a `PostgreSQL` in produzione o in una fase successiva.

## Requisiti locali

Installa prima:

1. `Node.js 20+`
2. `npm 10+`
3. Facoltativo ma consigliato: `Docker Desktop` per `PostgreSQL`

## Avvio locale rapido

1. Copia `.env.example` in `.env.local`
2. Imposta almeno questi valori:

```env
SITE_URL=http://localhost:3000
AMAZON_AFFILIATE_TAG=iltuotag-21
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
ADMIN_SESSION_SECRET=metti-una-stringa-lunga-e-casuale
USE_PRISMA=false
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codicisconto_eu?schema=public
```

3. Installa le dipendenze:

```bash
npm install
```

4. Avvia il progetto:

```bash
npm run dev
```

5. Apri:

- `http://localhost:3000`
- `http://localhost:3000/store/amazon`
- `http://localhost:3000/admin/login`

## Verifica locale

Controlla questi punti:

1. Homepage caricata con offerte demo.
2. Pagina Amazon raggiungibile e con link affiliati contenenti il parametro `tag`.
3. Ricerca funzionante su `/search`.
4. Login admin funzionante con le credenziali del `.env.local`.
5. Inserimento manuale di una nuova offerta da `/admin/offers`.
6. Cambio stato offerta da review a published.
7. Esecuzione import da `/admin/imports`.
8. Pubblicazione di un elemento importato in coda review.
9. `http://localhost:3000/sitemap.xml` presente.
10. `http://localhost:3000/robots.txt` presente.

## Test produzione-like in locale

Quando vuoi simulare la produzione:

```bash
npm run build
npm run start
```

Poi ricontrolla le stesse pagine su `http://localhost:3000`.

## PostgreSQL locale con Docker

Se vuoi tenere pronto anche il database:

```bash
docker compose up -d
```

Poi puoi generare il client Prisma:

```bash
npm run prisma:generate
```

Per creare le migration in locale:

```bash
npm run prisma:migrate
```

Nota: il runtime corrente del sito usa `data/store.json` come archivio locale immediato.
Lo schema Prisma e gia pronto per il passaggio a database relazionale quando vorrai fare il wiring completo a `PostgreSQL`.

## Come funziona l'import

Le fonti sono definite in `data/store.json`.

Tipi supportati:

- `fixture`: genera elementi demo locali per verificare il workflow
- `genericHtml`: prova a leggere una pagina pubblica e a estrarre frasi che contengono parole chiave come `sconto`, `coupon`, `codice`, `offerta`

Per partire davvero con fonti reali:

1. Apri `data/store.json`
2. Cerca `source_generic_public`
3. Sostituisci `baseUrl` con una sorgente pubblica reale
4. Metti `isActive` a `true`
5. Riesegui l'import da `/admin/imports`

## Audit delle fonti coupon

Per verificare una lista di fonti pubbliche e ottenere sample estratti:

```bash
npm run audit:sources
```

Input:

- `data/source-audit-targets.json`

Output:

- `docs/source-audit-output.json`

Lo script prova a:

- leggere `robots.txt`
- fetchare la pagina
- stimare se la fonte e server-rendered o JS-heavy
- rilevare auth wall o challenge
- estrarre blocchi candidati con titolo, codice, valore e scadenza testuale

Le fonti con login obbligatorio o challenge vengono marcate come `skip`.

## Credenziali admin

Il login usa queste variabili:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

La sessione viene salvata in un cookie `httpOnly`.

## File principali

- `app/`: frontend, admin e route API
- `components/`: componenti riusabili
- `data/store.json`: archivio locale dei contenuti
- `lib/store.ts`: funzioni CRUD e query
- `lib/import/`: pipeline import
- `lib/affiliate/amazon.ts`: aggiunta del tag affiliato
- `prisma/schema.prisma`: modello dati `PostgreSQL`

## Deploy successivo su server

Quando passeremo al server, aggiungeremo solo il nuovo progetto senza toccare gli altri.

Stack consigliato:

1. App Next.js su porta interna dedicata, per esempio `127.0.0.1:3005`
2. `nginx` come reverse proxy
3. servizio dedicato `systemd`
4. certificato SSL per `codicisconto.eu` e `www.codicisconto.eu`

## DNS da impostare

Quando il progetto sara pronto sul server:

- record `A` per `@` verso l'IP del server
- record `AAAA` per `@` verso IPv6, se usato
- record `CNAME` per `www` verso `codicisconto.eu`

Configurazione consigliata:

```text
@      A       <IP_SERVER>
www    CNAME   codicisconto.eu
```

## Note importanti

- In questa sessione non e stato possibile eseguire `npm` o `node` perche non risultano installati nel terminale disponibile.
- Il progetto e stato quindi costruito file per file ed e pronto da installare/eseguire appena `Node.js` sara disponibile sulla macchina.
