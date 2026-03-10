# Deploy produzione `codicisconto.eu`

Questa fase e da eseguire solo quando deciderai di collegarti al server.

## Obiettivo

Aggiungere un nuovo progetto isolato senza toccare gli altri siti gia presenti.

## Struttura consigliata sul server

- cartella progetto: `/var/www/codicisconto.eu/app`
- porta interna dedicata: `127.0.0.1:3005`
- reverse proxy: `nginx`
- processo Node: `systemd`

## Variabili ambiente minime

```env
NODE_ENV=production
PORT=3005
SITE_URL=https://codicisconto.eu
AMAZON_AFFILIATE_TAG=iltuotag-21
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password-forte>
ADMIN_SESSION_SECRET=<secret-lungo>
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
```

## Flusso deploy consigliato

1. Caricare il progetto sul server in una cartella dedicata.
2. Installare dipendenze con `npm ci`.
3. Eseguire `npm run build`.
4. Avviare l'app con `npm run start` sulla porta `3005`.
5. Verificare da shell con `curl http://127.0.0.1:3005`.
6. Configurare `nginx` per `codicisconto.eu` e `www.codicisconto.eu`.
7. Puntare i DNS.
8. Emettere SSL con Let's Encrypt.
9. Abilitare redirect `http -> https`.

## Esempio `nginx`

```nginx
server {
    listen 80;
    server_name codicisconto.eu www.codicisconto.eu;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## DNS

Configurazione consigliata:

```text
@      A       <IP_SERVER>
www    CNAME   codicisconto.eu
```

Se il server ha IPv6:

```text
@      AAAA    <IPV6_SERVER>
```

## Verifica finale

- `https://codicisconto.eu`
- `https://www.codicisconto.eu`
- `https://codicisconto.eu/sitemap.xml`
- `https://codicisconto.eu/robots.txt`
- login admin funzionante
- import manuale funzionante
