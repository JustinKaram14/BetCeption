# BetCeption – Test Commands

## Backend (`cd Betception-Backend`)

```bash
npm test                    # alle Tests einmalig ausführen
npm run test:watch          # Watch-Modus (bei Änderungen neu ausführen)
npm run test:ci             # CI-Modus mit Coverage-Report

# Einzelne Testgruppe gezielt ausführen
npm test -- --testPathPattern=auth.controller
npm test -- --testPathPattern=src/tests/modules
npm test -- --testPathPattern=src/tests/middlewares
npm test -- --testPathPattern=src/tests/utils

# DB-Integritätstest (⚠️ Docker muss laufen – startet MySQL-Container)
npm test -- --testPathPattern=db-integrity
```

## Frontend (`cd Betception-Frontend`)

```bash
npm test                    # Unit/Component-Tests mit Chrome (interaktiv)
npm run test:ci             # headless Chrome, kein Watch (für CI)
```

## E2E / Playwright (`cd Betception-Frontend`)

```bash
npm run e2e:install         # Chromium einmalig installieren
npm run e2e                 # Tests headless ausführen
npm run e2e:headed          # Tests mit sichtbarem Browser
```

## Performance / k6 (`cd Betception-Backend`)

```bash
# 1. Umgebung starten
npm run perf:env:up

# 2. Szenarien ausführen
npm run perf:auth           # Register + Login (10 VUs)
npm run perf:game           # Blackjack-Rundenablauf (10 VUs)
npm run perf:wallet         # Deposit + Summary (10 VUs)
npm run perf:leaderboard    # Alle Leaderboard-Endpunkte (20 VUs)
npm run perf                # Alle 4 Szenarien nacheinander

# 3. Umgebung beenden
npm run perf:env:down
```

> Ergebnisse liegen nach dem Lauf in `performance/results/` als JSON.
