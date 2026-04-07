# Cloud86 Deployment

Dieses Repository ist jetzt für ein Git-basiertes Deployment auf Cloud86 vorbereitet:

- `Betception-Frontend` baut eine statische Angular-Anwendung.
- `Betception-Backend` baut eine Node.js-Anwendung mit Produktivstart ohne Docker.
- Das Frontend liest seine API-URL zur Laufzeit aus `runtime-config.js`.

## Wichtige Cloud86-Einschränkung

Cloud86 dokumentiert Node.js derzeit für **Managed VPS**. Auf normalem Shared Webhosting kannst du das Angular-Frontend hosten, aber das Backend braucht einen Dienst mit Node.js-Unterstützung.

- Frontend: Shared Hosting oder Managed VPS
- Backend: Managed VPS mit Node.js in Plesk

Quelle:

- https://support.cloud86.io/hc/nl/articles/19592318660765-Managed-VPS-Beschikbare-software

## Empfohlene Zielstruktur

- Frontend: `https://www.deine-domain.tld`
- Backend: `https://api.deine-domain.tld`

Dann setzt du im Backend `FRONTEND_ORIGIN=https://www.deine-domain.tld` und im Frontend in `runtime-config.js` die API auf `https://api.deine-domain.tld`.

## Frontend deployen

Arbeitsverzeichnis: `Betception-Frontend`

1. Dependencies installieren: `npm install`
2. Production-Build erstellen: `npm run build`
3. Den Inhalt von `dist/Betception-Frontend/browser` als Document Root deployen

Hinweise:

- `public/.htaccess` ist bereits für Angular-SPA-Routing vorbereitet.
- Passe vor dem Deploy `public/runtime-config.js` an oder überschreibe die Datei auf dem Server.

Beispiel:

```js
window.__BETCEPTION_CONFIG__ = {
  apiBaseUrl: 'https://api.deine-domain.tld',
  includeCredentials: true,
};
```

## Backend deployen

Arbeitsverzeichnis: `Betception-Backend`

1. Dependencies installieren: `npm install`
2. `.env.example` nach `.env` kopieren und Werte setzen
3. Build erstellen: `npm run build`
4. In Plesk die Node-App auf dieses Verzeichnis zeigen lassen
5. Als Startup Command `npm run start:cloud86` verwenden

`start:cloud86` startet das kompilierte Backend und führt vorher automatisch offene TypeORM-Migrationen aus.

## Benötigte Backend-Umgebungsvariablen

Mindestens diese Werte müssen gesetzt sein:

```env
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=betception_user
DB_PASSWORD=...
DB_NAME=betception
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
FRONTEND_ORIGIN=https://www.deine-domain.tld
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
TRUST_PROXY=true
```

## Git-basierter Workflow

Im Repository gibt es jetzt einen GitHub-Actions-Workflow unter `.github/workflows/deploy-branch.yml`.

Bei jedem Push auf `main` baut er:

- das Backend
- das Frontend
- einen separaten Branch `deploy`

Der `deploy`-Branch enthält nur die benötigten Artefakte:

- `frontend/`: Inhalt aus `dist/Betception-Frontend/browser`
- `backend/dist/`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`

Damit kannst du auf dem Server direkt den Branch `deploy` auschecken oder pullen, statt im Produktivsystem selbst zu bauen.

### Server-Setup mit Deploy-Branch

- Frontend-Document-Root auf `frontend/` setzen
- Backend in `backend/` starten

Backend-Kommandos auf dem Server:

```bash
cd backend
npm install --omit=dev
npm run start:cloud86
```

## Monorepo-Hilfe

Aus dem Repository-Root funktionieren zusätzlich:

```bash
npm run install:all
npm run build
```
