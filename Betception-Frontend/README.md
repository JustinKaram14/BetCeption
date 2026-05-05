# BetCeption Frontend

Angular-SPA für das BetCeption Blackjack-Casino.  
Kommuniziert mit dem [BetCeption Backend](../Betception-Backend/README.md) via REST/JSON.

## Voraussetzungen

- Node.js ≥ 20
- Angular CLI: `npm install -g @angular/cli`
- Backend läuft auf `http://localhost:3000` (s. Backend-README)

## Entwicklungsserver starten

```bash
npm install
ng serve
```

Öffne **http://localhost:4200** im Browser. Die App lädt automatisch neu bei Dateiänderungen.

> Damit Login und Cookies funktionieren muss das Backend laufen (`npm start` im `Betception-Backend`-Ordner).

## API-URL konfigurieren

Die App liest die Backend-URL aus `public/runtime-config.js`. Für lokale Entwicklung ist der Default `http://localhost:3000` gesetzt. Für andere Umgebungen (z. B. Staging, Cloud86) die Datei anpassen:

```js
// public/runtime-config.js
window.__BETCEPTION_CONFIG__ = {
  apiBaseUrl: 'https://api.example.com',
  includeCredentials: true,
};
```

## Build

```bash
ng build               # Development-Build
ng build --configuration production   # Production-Build (optimiert)
```

Artefakte landen in `dist/Betception-Frontend/browser/`.  
Für Apache/Plesk-Hosting ist eine `.htaccess` für SPA-Routing unter `public/.htaccess` enthalten.

## Unit-Tests (Karma/Jasmine)

```bash
npm test               # interaktiv mit Chrome
npm run test:ci        # headless, einmaliger Lauf mit Coverage (für CI)
```

37 Spec-Dateien – decken Services, Guards, Interceptors, Pipes und alle Feature-Komponenten ab.

## E2E-Tests (Playwright)

```bash
npm run e2e:install    # Chromium einmalig herunterladen
npm run e2e            # Tests headless ausführen
npm run e2e:headed     # Tests mit sichtbarem Browser
```

5 Spec-Dateien in `tests/e2e/`: Auth-Flows, Routing, Modals, Blackjack-Game, Settings.  
Vollständiges Backend muss für E2E-Tests laufen.

## Projektstruktur

```
src/app/
├── core/
│   ├── api/           # HttpClient-Wrapper, BetceptionApi-Service
│   ├── auth/          # Guard, Interceptor, Token-Storage
│   ├── i18n/          # Internationalisierung (DE/EN/ES/FR)
│   ├── layout/        # AppShell
│   └── services/      # Wallet-Service, RNG-Service
├── features/
│   ├── auth/          # Login, Register, Verify-Email
│   ├── casino/
│   │   ├── blackjack/ # Spieltisch, Hand, Controls
│   │   ├── homepage/  # Hero, Leaderboard, Daily-Reward-Modal, …
│   │   └── risk-up/   # CardGuess-Komponente
│   └── legal/         # Impressum, Datenschutz
└── shared/
    ├── pipes/         # FormatCoins
    └── ui/            # Button, Toast, NotFound, …
```
