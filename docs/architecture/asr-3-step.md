# Architecture Significant Requirements (ASR)

Eine architektonisch bedeutsame Anforderung (ASR) veraendert die Systemarchitektur so stark, dass das Design ohne sie fundamental anders waere. Dieses Dokument folgt dem in der Vorlesung beschriebenen 3-Schritt-Ansatz: Qualitaetsmerkmale klaeren, passende Taktiken auswaehlen und daraus konkrete Architekturentscheidungen ableiten.

## Schritt 1 - Klaerung der Qualitaetsmerkmale

Aufbauend auf Geschaefts- und Stakeholderzielen werden Qualitaetsattribute samt Szenarien nach der 6-Part Form beschrieben. Der Utility Tree dient dabei als Leitfaden, genauso wie auf den Folien gefordert.

### 1.1 Geschaefts- und Stakeholderziele

| Treiber | Beschreibung | Architektur-Auswirkung |
| --- | --- | --- |
| Spieler:innen wollen jederzeit faire Blackjack-Runden mit nachvollziehbaren Ergebnissen erleben. | Rundenlogik, Kartengenerierung und Auszahlungen muessen serverseitig deterministisch und einsehbar sein. | Backend kontrolliert RNG und stellt ein Fairness-API fuer Auditierung bereit; keine Logik im Client, konsequente Persistenz aller Schritte. |
| Betreiber:in benoetigt ein betrugssicheres Wallet ohne Echtgeld, aber mit exakten Buchungen. | Einsaetze, Sidebets, Power-Ups und Rewards beruehren das Wallet und duerfen nie doppelt oder verloren werden. | Transaktionen und Sperren in der Datenbank, Validierung vor jedem State-Change, zentrale Wallet-Services. |
| Das Entwicklerteam muss Features schnell liefern, testen und deployen koennen. | Wartbarkeit, Modularitaet, automatisierte Tests sowie Docker-basierte Umgebung sind Pflicht. | Layered Express/TypeORM-Architektur, Feature-Module, CI/CD-Pipelines, Infrastructure-as-Code. |
| Compliance/Security verlangt Schutz personenbezogener Daten (E-Mail, Tokens) und Resilienz gegen Missbrauch. | Authentifizierung, Sessions und Rate-Limiting muessen Standards folgen; Geheimnisse duerfen nicht ins Repo. | JWT + Refresh-Cookies, verschluesselte Hashes, Rate-Limiter, Secrets via `.env`. |
| Produktmanagement erwartet Responsive SPA mit <2 s Time-to-interact und 95 % API-Responses <300 ms. | Performance-Ziele beeinflussen Technologie-Stack, Datenmodellierung und API-Design. | Angular Single-Page-Frontend, schlanke JSON-APIs, indizierte Tabellen, asynchrone I/O im Backend. |

### 1.2 Utility Tree & Qualitaetsattribut-Szenarien

Der Utility Tree fasst die qualitativen Treiber zusammen. Alle Szenarien sind - wie auf der Folie gefordert - in der 6-Part Form dokumentiert und bilden die Grundlage fuer Priorisierung (Business-Prioritaet, Risiko) und fuer die folgenden Schritte.

![Utility Tree](../assets/Utility/Utility.png)

| Qualitaetsattribut | Quelle | Stimulus | Artefakt | Umgebung | Reaktion | Messung | BP | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zuverlaessigkeit (Datenkonsistenz) | Spieler-Client | Browser verliert direkt nach Einsatzreservierung die Verbindung | Round-/Wallet-Service | Runde "IN_PROGRESS" | Backend stellt beim Reload denselben Status her, Einsaetze hoechstens einmal gebucht | <= 1 Wallet-Buchung pro Round-ID, Round-Status abrufbar <1 s | Hoch | Mittel |
| Sicherheit (Integritaet & Auditierbarkeit) | Spieler:in | `GET /fairness/{roundId}` nach Abschluss | Fairness-API & Round-Datensatz | Runde "SETTLED" | Server liefert `serverSeed`, Hash und Zeitstempel zur Offline-Verifikation | 100 % der settled Runden liefern Matching Hash & Seed | Hoch | Mittel |
| Performance | 100 parallele Sessions | `POST /round/start` | Round-Start-Endpunkt | Normalbetrieb mit produktionsnaher Datenbank | Antworten bleiben schnell und vollstaendig | p95 < 300 ms, keine Timeouts | Hoch | Mittel |
| Sicherheit (Zugriffsschutz) | Angreifer:in | 200 Login-Versuche/min mit falschen Credentials | Auth-API (`/auth/login`,`/auth/refresh`) | Normalbetrieb | Rate-Limiter sperrt Identitaet/IP nach 10 Fehlversuchen, Fehlermeldungen bleiben generisch | Max. 10 Fehlversuche/5 min pro IP oder E-Mail | Hoch | Hoch |
| Wartbarkeit / Modifizierbarkeit | Entwickler:in | Neue Sidebet-Regel wird implementiert | Round-Modul (Engine + Tests) | Design-/Implementierungsphase | Aenderungen bleiben auf Domaene beschraenkt und sind testbar | < 2 Dateien ausserhalb `modules/round` betroffen, Tests bestehen | Mittel | Mittel |
| Verfuegbarkeit & Beobachtbarkeit | On-Call | Supportticket verlangt Ursachenanalyse | `/metrics` + strukturierte Logs | Produktion, Monitoring aktiviert | Telemetrie & Logs liefern Request-IDs, Fehler- & Latenzwerte | 100 % Requests mit `X-Request-Id`, `/metrics` antwortet <1 s | Mittel | Niedrig |

## Schritt 2 - Taktiken je Qualitaetsattribut

Im zweiten Schritt - analog zum Tactics Tree aus der Vorlesung - werden pro Szenario die massgeblichen Taktiken festgelegt und mit konkreten Architekturbausteinen verknuepft.

| Qualitaetsattribut / Refinement | Ausgewaehlte Taktiken | Umsetzung im System |
| --- | --- | --- |
| Zuverlaessigkeit - Konsistente Wallet-Buchungen | Atomare Transaktionen, State-Recovery, Idempotente Commands | `AppDataSource.transaction` buendelt Round- & Wallet-Updates, pessimistic locking im `wallet`-Modul verhindert doppelte Buchungen, Round-ID + Einsatz fungieren als Idempotenzschluessel fuer Reloads. |
| Sicherheit - Auditierbarer Fairness-Nachweis | Deterministisches RNG, Record/Replay, Sicherer Hash | `round.controller.ts` erzeugt Seeds ausschliesslich serverseitig, `fairness.utils.ts` persistiert `serverSeed` + `serverSeedHash` (SHA-256) und das `fairness.controller.ts` liefert beides zur Offline-Verifikation aus. |
| Sicherheit - Zugriffsschutz & Missbrauchspraevention | Rate Limiting, Authentifizierung, Fail-Secure Defaults | `authRateLimiter`/`globalRateLimiter` (Express-Rate-Limit) stoppen nach 10 Fehlern, JWT + Refresh-Cookies bleiben HttpOnly/SameSite, Tokens werden mit `hashToken` abgesichert und Fehlerantworten verbergen Details. |
| Performance - Round-Start-Latenz | Ressourcen-Pooling, Asynchrone I/O, Caching & Indizes | Node.js Event-Loop + `Promise.all` minimieren Blocking, TypeORM Connection-Pool versorgt `round.service.ts`, Indizes auf Runden- und Wallet-Tabellen reduzieren Query-Zeit, DTOs liefern nur benoetigte Felder. |
| Wartbarkeit - Lokale Sidebet-Anpassungen | Separation of Concerns, Information Hiding, Testautomatisierung | Feature-Module (`src/modules/round/*`) kapseln Engine, DTOs & Tests; `zod`-Schemas sichern Eingaben; Jest-Tests (Round-/Sidebet-Suites) pruefen Regeln, sodass neue Varianten lokal angepasst werden koennen. |
| Verfuegbarkeit & Beobachtbarkeit - Telemetrie | Monitoring, Request Tracing, Fehlererkennung | `requestContext`-Middleware vergibt `X-Request-Id`, `observability/metrics.ts` erfasst Status/Latency, `logger.ts` produziert strukturierte JSON-Logs; Health-/Metrics-Routen sind per Feature-Flags abgesichert. |

## Schritt 3 - Abgeleitete Architecture Significant Requirements

Die ASR referenzieren die priorisierten Szenarien aus Schritt 1 und die Taktiken aus Schritt 2. Sie bilden verbindliche Leitplanken fuer Umsetzung und Reviews.

| ASR | Beschreibung | Begruendung (Schritt 1+2) | Technische Umsetzung |
| --- | --- | --- | --- |
| ASR-1 Deterministische Spielengine | Kartenmischung & Spielstatus laufen ausschliesslich im Backend. Jede Runde persistiert `serverSeed`, `serverSeedHash`, Aktionen und Resultate. | Utility Tree "Auditierbarer Fairness-Nachweis" + Spieler:innen-Treiber: Nur deterministische Speicherung erlaubt Replays und Pruefungen. | `round.controller.ts` generiert Seeds, `fairness.controller.ts` liefert sie aus; RNG basiert auf Fisher-Yates + SHA-256 (`fairness.utils.ts`). |
| ASR-2 Atomare Wallet-Buchungen | Einsaetze, Gewinne und Power-Up-Kaeufe sind atomar - kein State darf bei Fehlern halb geschrieben werden. | Utility Tree "Konsistente Wallet-Buchungen" + Betreiberziel. | TypeORM-Transaktionen (`AppDataSource.transaction`) buendeln Wallet, Round-Status und Inventory; pessimistic locking auf User/Wallet verhindert doppelte Buchungen. |
| ASR-3 Gesicherter Auth-Flow | JWTs sichern APIs; Refresh-Tokens liegen in HttpOnly+Secure Cookies und werden serverseitig gehaertet. Rate-Limiter schuetzen Auth-Routen. | Utility Tree "Zugriffsschutz & Missbrauchspraevention" + Compliance-Vorgaben. | `auth.controller.ts` hasht Refresh-Tokens (`hashToken`), Sessions speichern User-Agent/IP; `globalRateLimiter`/`authRateLimiter`, `apiKeyGuard` und generische Fehlertexte. |
| ASR-4 Auditierbare Fairness-Schnittstelle | Settled Runden muessen vollstaendig reproduzierbar sein (Seed + Hash + Draw Order). | Szenario "`GET /fairness/{roundId}`" sowie Spieler:innenziel. | `fairness.controller.ts`, `fairness.utils.ts`, persistente Seeds pro Round, GET `/fairness/{roundId}` inklusive ServerSeed & Hash. |
| ASR-5 Performante API & SPA | Round-Start-Flow bleibt performant trotz Sidebets & Power-Ups. | Utility Tree "Round-Start-Latenz" + Produktmanagementziel. | Ressourcensparende DTOs, Pagination (`leaderboard`, `fairness`), Indizes auf Round/User, Node.js Async I/O, Angular Lazy Loading. |
| ASR-6 Diagnostizierbarkeit & Betrieb | Jede Anfrage erhaelt `X-Request-Id`, Logs sind strukturiert, `/metrics` liefert Snapshots. Feature-Toggles schuetzen Docs & Metrics. | Utility Tree "Telemetrie fuer Incident Response" + On-Call-Anforderungen. | `requestContext` Middleware setzt IDs, `observability/metrics.ts` liefert Kennzahlen, `setupSwagger` + API-Key-Guards & Env-Flags `METRICS_ENABLED`/`DOCS_ENABLED`. |
| ASR-7 Modular ausbaubare Domaenen | Neue Features (Leaderboard, Rewards, XP) beruehren bestehende Module nur minimal. | Wartbarkeitsszenario "Lokale Sidebet-Anpassungen" + Teamziel. | Ordner pro Modul (`modules/*`), Zod-Schemata fuer Input, TypeORM Entities pro Aggregat, Angular Feature-Module spiegeln Backend-Domaenen. |

Vor jeder groesseren Aenderung pruefen wir daher, welches Utility-Tree-Szenario bzw. welche ASR betroffen ist und ob zusaetzliche Taktiken aus dem Kurs-Framework angewendet werden muessen.
