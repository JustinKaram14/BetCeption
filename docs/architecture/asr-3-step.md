# Architecture Significant Requirements (ASR)

Eine architektonisch bedeutsame Anforderung (ASR) verändert die Systemarchitektur so stark, dass das Design ohne sie fundamental anders wäre. Dieses Dokument folgt dem in der Vorlesung beschriebenen 3-Schritt-Ansatz: Qualitätsmerkmale klären, passende Taktiken auswählen und daraus konkrete Architekturentscheidungen ableiten.

## Schritt 1 - Klärung der Qualitätsmerkmale

Aufbauend auf Geschäfts- und Stakeholderzielen werden Qualitätsattribute samt Szenarien nach der 6-Part Form beschrieben. Der Utility Tree dient dabei als Leitfaden, genauso wie auf den Folien gefordert.

### 1.1 Geschäfts- und Stakeholderziele

| Treiber | Beschreibung | Architektur-Auswirkung |
| --- | --- | --- |
| Spieler:innen wollen jederzeit faire Blackjack-Runden mit nachvollziehbaren Ergebnissen erleben. | Rundenlogik, Kartengenerierung und Auszahlungen müssen serverseitig deterministisch und einsehbar sein. | Backend kontrolliert RNG und stellt ein Fairness-API für Auditierung bereit; keine Logik im Client, konsequente Persistenz aller Schritte. |
| Betreiber:in benötigt ein betrugssicheres Wallet ohne Echtgeld, aber mit exakten Buchungen. | Einsätze, Sidebets, Power-Ups und Rewards berühren das Wallet und dürfen nie doppelt oder verloren werden. | Transaktionen und Sperren in der Datenbank, Validierung vor jedem State-Change, zentrale Wallet-Services. |
| Das Entwicklerteam muss Features schnell liefern, testen und deployen können. | Wartbarkeit, Modularität, automatisierte Tests sowie Docker-basierte Umgebung sind Pflicht. | Layered Express/TypeORM-Architektur, Feature-Module, CI/CD-Pipelines, Infrastructure-as-Code. |
| Compliance/Security verlangt Schutz personenbezogener Daten (E-Mail, Tokens) und Resilienz gegen Missbrauch. | Authentifizierung, Sessions und Rate-Limiting müssen Standards folgen; Geheimnisse dürfen nicht ins Repo. | JWT + Refresh-Cookies, verschlüsselte Hashes, Rate-Limiter, Secrets via `.env`. |
| Produktmanagement erwartet Responsive SPA mit <2 s Time-to-interact und 95 % API-Responses <300 ms. | Performance-Ziele beeinflussen Technologie-Stack, Datenmodellierung und API-Design. | Angular Single-Page-Frontend, schlanke JSON-APIs, indizierte Tabellen, asynchrone I/O im Backend. |

### 1.2 Utility Tree & Qualitätsattribut-Szenarien

Der Utility Tree fasst die qualitativen Treiber zusammen. Alle Szenarien sind - wie auf der Folie gefordert - in der 6-Part Form dokumentiert und bilden die Grundlage für Priorisierung (Business-Priorität, Risiko) und für die folgenden Schritte.

![Utility Tree](../assets/Utility/Utility.png)

| Qualitätsattribut | Quelle | Stimulus | Artefakt | Umgebung | Reaktion | Messung | BP | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zuverlässigkeit (Datenkonsistenz) | Spieler-Client | Browser verliert direkt nach Einsatzreservierung die Verbindung | Round-/Wallet-Service | Runde "IN_PROGRESS" | Backend stellt beim Reload denselben Status her, Einsätze höchstens einmal gebucht | <= 1 Wallet-Buchung pro Round-ID, Round-Status abrufbar <1 s | Hoch | Mittel |
| Sicherheit (Integrität & Auditierbarkeit) | Spieler:in | `GET /fairness/{roundId}` nach Abschluss | Fairness-API & Round-Datensatz | Runde "SETTLED" | Server liefert `serverSeed`, Hash und Zeitstempel zur Offline-Verifikation | 100 % der settled Runden liefern Matching Hash & Seed | Hoch | Mittel |
| Performance | 100 parallele Sessions | `POST /round/start` | Round-Start-Endpunkt | Normalbetrieb mit produktionsnaher Datenbank | Antworten bleiben schnell und vollständig | p95 < 300 ms, keine Timeouts | Hoch | Mittel |
| Sicherheit (Zugriffsschutz) | Angreifer:in | 200 Login-Versuche/min mit falschen Credentials | Auth-API (`/auth/login`,`/auth/refresh`) | Normalbetrieb | Rate-Limiter sperrt Identität/IP nach 10 Fehlversuchen, Fehlermeldungen bleiben generisch | Max. 10 Fehlversuche/5 min pro IP oder E-Mail | Hoch | Hoch |
| Wartbarkeit / Modifizierbarkeit | Entwickler:in | Neue Sidebet-Regel wird implementiert | Round-Modul (Engine + Tests) | Design-/Implementierungsphase | Änderungen bleiben auf Domäne beschränkt und sind testbar | < 2 Dateien außerhalb `modules/round` betroffen, Tests bestehen | Mittel | Mittel |
| Verfügbarkeit & Beobachtbarkeit | On-Call | Supportticket verlangt Ursachenanalyse | `/metrics` + strukturierte Logs | Produktion, Monitoring aktiviert | Telemetrie & Logs liefern Request-IDs, Fehler- & Latenzwerte | 100 % Requests mit `X-Request-Id`, `/metrics` antwortet <1 s | Mittel | Niedrig |

## Schritt 2 - Taktiken je Qualitätsattribut

Im zweiten Schritt - analog zum Tactics Tree aus der Vorlesung - werden pro Szenario die maßgeblichen Taktiken festgelegt und mit konkreten Architekturbausteinen verknüpft.

| Qualitätsattribut / Refinement | Ausgewählte Taktiken | Umsetzung im System |
| --- | --- | --- |
| Zuverlässigkeit - Konsistente Wallet-Buchungen | Atomare Transaktionen, State-Recovery, Idempotente Commands | `AppDataSource.transaction` bündelt Round- & Wallet-Updates, pessimistic locking im `wallet`-Modul verhindert doppelte Buchungen, Round-ID + Einsatz fungieren als Idempotenzschlüssel für Reloads. |
| Sicherheit - Auditierbarer Fairness-Nachweis | Deterministisches RNG, Record/Replay, Sicherer Hash | `round.controller.ts` erzeugt Seeds ausschließlich serverseitig, `fairness.utils.ts` persistiert `serverSeed` + `serverSeedHash` (SHA-256) und das `fairness.controller.ts` liefert beides zur Offline-Verifikation aus. |
| Sicherheit - Zugriffsschutz & Missbrauchsprävention | Rate Limiting, Authentifizierung, Fail-Secure Defaults | `authRateLimiter`/`globalRateLimiter` (Express-Rate-Limit) stoppen nach 10 Fehlern, JWT + Refresh-Cookies bleiben HttpOnly/SameSite, Tokens werden mit `hashToken` abgesichert und Fehlerantworten verbergen Details. |
| Performance - Round-Start-Latenz | Ressourcen-Pooling, Asynchrone I/O, Caching & Indizes | Node.js Event-Loop + `Promise.all` minimieren Blocking, TypeORM Connection-Pool versorgt `round.service.ts`, Indizes auf Runden- und Wallet-Tabellen reduzieren Query-Zeit, DTOs liefern nur benötigte Felder. |
| Wartbarkeit - Lokale Sidebet-Anpassungen | Separation of Concerns, Information Hiding, Testautomatisierung | Feature-Module (`src/modules/round/*`) kapseln Engine, DTOs & Tests; `zod`-Schemas sichern Eingaben; Jest-Tests (Round-/Sidebet-Suites) prüfen Regeln, sodass neue Varianten lokal angepasst werden können. |
| Verfügbarkeit & Beobachtbarkeit - Telemetrie | Monitoring, Request Tracing, Fehlererkennung | `requestContext`-Middleware vergibt `X-Request-Id`, `observability/metrics.ts` erfasst Status/Latency, `logger.ts` produziert strukturierte JSON-Logs; Health-/Metrics-Routen sind per Feature-Flags abgesichert. |

## Schritt 3 - Abgeleitete Architecture Significant Requirements

Die ASR referenzieren die priorisierten Szenarien aus Schritt 1 und die Taktiken aus Schritt 2. Sie bilden verbindliche Leitplanken für Umsetzung und Reviews.

| ASR | Beschreibung | Begründung (Schritt 1+2) | Technische Umsetzung |
| --- | --- | --- | --- |
| ASR-1 Deterministische Spielengine | Kartenmischung & Spielstatus laufen ausschließlich im Backend. Jede Runde persistiert `serverSeed`, `serverSeedHash`, Aktionen und Resultate. | Utility Tree "Auditierbarer Fairness-Nachweis" + Spieler:innen-Treiber: Nur deterministische Speicherung erlaubt Replays und Prüfungen. | `round.controller.ts` generiert Seeds, `fairness.controller.ts` liefert sie aus; RNG basiert auf Fisher-Yates + SHA-256 (`fairness.utils.ts`). |
| ASR-2 Atomare Wallet-Buchungen | Einsätze, Gewinne und Power-Up-Käufe sind atomar - kein State darf bei Fehlern halb geschrieben werden. | Utility Tree "Konsistente Wallet-Buchungen" + Betreiberziel. | TypeORM-Transaktionen (`AppDataSource.transaction`) bündeln Wallet, Round-Status und Inventory; pessimistic locking auf User/Wallet verhindert doppelte Buchungen. |
| ASR-3 Gesicherter Auth-Flow | JWTs sichern APIs; Refresh-Tokens liegen in HttpOnly+Secure Cookies und werden serverseitig gehärtet. Rate-Limiter schützen Auth-Routen. | Utility Tree "Zugriffsschutz & Missbrauchsprävention" + Compliance-Vorgaben. | `auth.controller.ts` hasht Refresh-Tokens (`hashToken`), Sessions speichern User-Agent/IP; `globalRateLimiter`/`authRateLimiter`, `apiKeyGuard` und generische Fehlertexte. |
| ASR-4 Auditierbare Fairness-Schnittstelle | Settled Runden müssen vollständig reproduzierbar sein (Seed + Hash + Draw Order). | Szenario "`GET /fairness/{roundId}`" sowie Spieler:innenziel. | `fairness.controller.ts`, `fairness.utils.ts`, persistente Seeds pro Round, GET `/fairness/{roundId}` inklusive ServerSeed & Hash. |
| ASR-5 Performante API & SPA | Round-Start-Flow bleibt performant trotz Sidebets & Power-Ups. | Utility Tree "Round-Start-Latenz" + Produktmanagementziel. | Ressourcensparende DTOs, Pagination (`leaderboard`, `fairness`), Indizes auf Round/User, Node.js Async I/O, Angular Lazy Loading. |
| ASR-6 Diagnostizierbarkeit & Betrieb | Jede Anfrage erhält `X-Request-Id`, Logs sind strukturiert, `/metrics` liefert Snapshots. Feature-Toggles schützen Docs & Metrics. | Utility Tree "Telemetrie für Incident Response" + On-Call-Anforderungen. | `requestContext` Middleware setzt IDs, `observability/metrics.ts` liefert Kennzahlen, `setupSwagger` + API-Key-Guards & Env-Flags `METRICS_ENABLED`/`DOCS_ENABLED`. |
| ASR-7 Modular ausbaubare Domänen | Neue Features (Leaderboard, Rewards, XP) berühren bestehende Module nur minimal. | Wartbarkeitsszenario "Lokale Sidebet-Anpassungen" + Teamziel. | Ordner pro Modul (`modules/*`), Zod-Schemata für Input, TypeORM Entities pro Aggregat, Angular Feature-Module spiegeln Backend-Domänen. |

Vor jeder größeren Änderung prüfen wir daher, welches Utility-Tree-Szenario bzw. welche ASR betroffen ist und ob zusätzliche Taktiken aus dem Kurs-Framework angewendet werden müssen.
