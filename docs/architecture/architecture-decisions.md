# Architekturentscheidungen & Entwurfsmuster

Dieses Dokument sammelt die wichtigsten Architekturentscheidungen für BetCeption. Es referenziert die ASR (`asr-3-step.md`) und beschreibt, welche Taktiken und konkreten Muster wir einsetzen.

## 1. Entscheidungsportfolio
| ID | Entscheidung | Motivation & betroffene ASR | Taktiken & Muster | Status |
| --- | --- | --- | --- | --- |
| AD-1 | Blackjack-Engine bleibt komplett serverseitig, Seeds & Decks werden deterministisch berechnet. | Treiber: faire, prüfbare Runden (ASR-1, UT-R2). | Taktiken: kontrollierte Zufallsquelle, Commitment vor Reveal; Muster: Transaction Script + deterministische RNG (Fisher-Yates) (`round.controller.ts`, `fairness.utils.ts`). | in Be4arbeitung |
| AD-2 | Wallet-Buchungen laufen über ein Ledger (`wallet_transactions`) innerhalb von ACID-Transaktionen. | Treiber: Datenkonsistenz, Betreiberziele (ASR-2, UT-R1). | Taktiken: pessimistic locking, atomic commit; Muster: Unit of Work (TypeORM Transaction), Ledger-Pattern (`round.controller.ts`, `powerups.controller.ts`). | in Bearbeitung |
| AD-3 | Authentifizierung nutzt JWT für Zugriffe und HttpOnly-Refresh-Cookies plus Session-Store. | Treiber: Sicherheit, Revocation (ASR-3, UT-S1). | Taktiken: Eingabeverifikation, Rate-Limiting, Token Hardening; Muster: Middleware-Kette (`app.ts`, `middlewares/*`), Repository für Sessions (`auth.controller.ts`). | umgesetzt |
| AD-4 | Dokumentation (`/docs`) und Telemetrie (`/metrics`) sind Feature-toggled und optional per API-Key gesichert. | Treiber: Betrieb & Minimierung der Angriffsfläche (ASR-5, UT-O1). | Taktiken: Feature Toggle, Defense in Depth; Muster: Decorator/Middleware via `apiKeyGuard`, Observer für Metrics (`observability/metrics.ts`). | umgesetzt |
| AD-5 | Feature-Folder-Struktur: Jede Domäne hat Router, Controller, Schema, Entity. Validierung läuft mit Zod-Schemata pro Modul. | Treiber: Wartbarkeit & Testbarkeit (ASR-6, UT-M1). | Taktiken: Separation of Concerns, Input Validation; Muster: Layered Architecture, DTO/Schema Pattern (`modules/*/*.schema.ts`). | umgesetzt |
| AD-6 | GitHub Actions + Docker Compose definieren einheitliche Laufzeit für Backend & DB. | Treiber: Deployment-Parität, schnelles Onboarding (Supportability 3.5). | Taktiken: Automatisierung, Environment Parity; Muster: Infrastructure-as-Code (`docker-compose.yml`, `.github/workflows/*`). | in Bearbeitung |
| AD-7 | Rate Limiting & Request-Kontext sind Cross-Cutting Concerns, die über Middlewares injiziert werden. | Treiber: Sicherheit & Observability (ASR-3, ASR-5). | Taktiken: Throttling, Correlation IDs; Muster: Express Middleware Chain (`middlewares/rateLimiters.ts`, `middlewares/requestContext.ts`). | umgesetzt |

## 2. Übersicht der eingesetzten Taktiken
| Qualitätsziel | Taktiken | Umsetzung |
| --- | --- | --- |
| Zuverlässigkeit | ACID-Transaktionen, pessimistic locking, Idempotenz | `AppDataSource.transaction` in Round/Powerup/Wallet, Sperren auf `User`- und `UserPowerup`-Tabellen; API-Design erzwingt eine aktive Runde pro User. |
| Sicherheit | Hashing (bcrypt, SHA-256), Token-Minimierung, Rate-Limiting, Principle of Least Privilege | `hashPassword`, `hashToken`, globale und auth-spezifische Limiter, getrennte Secrets für Access/Refresh, optionale API-Key-Guards für Swagger/Metrics. |
| Performance | Pagination, limitierte Projektion, asynchrone I/O, vorvalidierte Payloads | `leaderboard`- und `fairness`-Routen paginieren `findAndCount`; Express verwendet `express.json()` + Zod-Schemata, um invalide Payloads früh zu droppen. |
| Beobachtbarkeit | Structured Logging, Request-IDs, Metrics-Snapshot | `requestContext` generiert IDs & legt sie in `res.locals`, Logger in `utils/logger.ts` schreibt JSON; `observability/metrics.ts` zählt Requests, Fehler, Latenzen. |
| Wartbarkeit | Feature Modules, DTO/Schema-Layer, klare Boundaries zwischen Router/Controller/Service | Jede Domäne (`auth`, `round`, `wallet`, ... ) besitzt eigene Router und Schemata; Tests können Module isoliert importieren; Angular spiegelt dieselbe Struktur im Frontend. |
| Deployment | Automatismen für Build/Test/Migrate, Container-Orchestrierung | `docker-entrypoint.sh` führt `npm run migrate` aus; GitHub Actions starten `npm test` + Linting bei jedem Push. |

## 3. Eingesetzte Entwurfsmuster
| Muster | Rolle im Projekt | Beispiel |
| --- | --- | --- |
| Layered + Feature-Folder Architektur | Trennung von API (Router/Controller), Domain-Logik und Persistence pro Feature. | `src/modules/round` enthält Router, Schema und Controller, `src/entity` kapselt Datenmodell. |
| Repository / Data Mapper | TypeORM-Repository isoliert SQL und liefert Entities, sodass Business-Logik nicht direkt mit SQL spricht. | `AppDataSource.getRepository(User)` in `auth.controller.ts`. |
| Transaction Script | Komplexe Abläufe (Start/Resolve Round, Consume Powerup) werden als sequentielle Skripte in einer Transaktion implementiert. | `startRound`, `resolveRound` in `round.controller.ts`. |
| Middleware / Decorator | Cross-Cutting Concerns (CORS, Logging, Context, Rate Limits) werden über Express-Middlewares angehängt. | `app.ts` registriert `corsMiddleware`, `requestContext`, `globalRateLimiter`. |
| Feature Toggle | Bestimmte Oberflächen (Swagger, Metrics) werden nur bei aktivierten Flags oder API-Keys freigegeben. | `setupSwagger` + Guards in `app.ts`, Environment-Flags `DOCS_ENABLED`, `METRICS_ENABLED`. |
| Ledger Pattern | Wallet-Transaktionen werden in einer separaten Tabelle protokolliert, um Finanzen nachvollziehbar zu machen. | `WalletTransaction` Entity + Verweise auf `main_bets`/`side_bets`. |
| Domain-spezifische Errors | Kontrollierte Fehlercodes beschleunigen Debugging und sichern API-Kontrakte. | `RoundFlowError`, `PowerupConsumptionError` liefern Status & Business-Code. |

Die Entscheidungen, Taktiken und Muster bilden die Grundlage für spätere ADRs. Neue Architekturentscheidungen werden anhand der ASR bewertet und in diesem Dokument ergänzt.
