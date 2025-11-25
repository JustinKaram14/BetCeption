# Architecture Significant Requirements (ASR)

Dieses Dokument folgt dem 3-Schritte-Ansatz aus der Vorlesung. Ausgehend von Geschäfts- und Stakeholderzielen (Schritt 1) werden die kritischsten Qualitätsattribute samt Szenarien bestimmt (Schritt 2), bevor daraus konkrete Architecture Significant Requirements abgeleitet werden (Schritt 3).

## Schritt 1 - Geschäfts- und Stakeholderziele
| Treiber | Beschreibung | Architektur-Auswirkung |
| --- | --- | --- |
| Spieler:innen wollen jederzeit faire Blackjack-Runden mit nachvollziehbaren Ergebnissen erleben. | Rundenlogik, Kartengenerierung und Auszahlungen müssen serverseitig deterministisch und einsehbar sein. | Backend kontrolliert RNG und stellt ein Fairness-API für Auditierung bereit; keine Logik im Client, konsequente Persistenz aller Schritte. |
| Betreiber:in benötigt ein betrugssicheres Wallet ohne Echtgeld, aber mit exakten Buchungen. | Einsätze, Sidebets, Power-Ups und Rewards berühren das Wallet und dürfen nie doppelt oder verloren werden. | Transaktionen und Sperren in der Datenbank, Validierung vor jedem State-Change, zentrale Wallet-Services. |
| Das Entwicklerteam muss Features schnell liefern, testen und deployen können. | Wartbarkeit, Modularität, automatisierte Tests sowie Docker-basierte Umgebung sind Pflicht. | Layered Express/TypeORM-Architektur, Feature-Module, CI/CD-Pipelines, Infrastructure-as-Code. |
| Compliance/Security verlangt Schutz personenbezogener Daten (E-Mail, Tokens) und Resilienz gegen Missbrauch. | Authentifizierung, Sessions und Rate-Limiting müssen Standards folgen; Geheimnisse dürfen nicht ins Repo. | JWT + Refresh-Cookies, verschlüsselte Hashes, Rate-Limiter, Secrets via `.env`. |
| Produktmanagement erwartet Responsive SPA mit <2 s Time-to-interact und 95 % API-Responses <300 ms. | Performance-Ziele beeinflussen Technologie-Stack, Datenmodellierung und API-Design. | Angular Single-Page-Frontend, schlanke JSON-APIs, indizierte Tabellen, asynchrone I/O im Backend. |

## Schritt 2 - Kritische Qualitätsattribute & Szenarien (6-Part Form)
Die Szenarien orientieren sich an der im Kurs behandelten 6-Part Form (Quelle, Stimulus, Artefakt, Umgebung, Reaktion, Messung). Business-Priorität (BP) und Risiko (R) folgen dem Utility-Tree-Workshop.

| Qualitätsattribut | Quelle | Stimulus | Artefakt | Umgebung | Reaktion | Messung | BP | R |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zuverlässigkeit (Datenkonsistenz) | Spieler-Client | Browser verliert direkt nach Einsatzreservierung die Verbindung | Round-/Wallet-Service | Runde „IN_PROGRESS“ | Backend stellt beim Reload denselben Status her, Einsätze höchstens einmal gebucht | ≤ 1 Wallet-Buchung pro Round-ID, Round-Status abrufbar <1 s | Hoch | Mittel |
| Sicherheit (Integrität & Auditierbarkeit) | Spieler:in | `GET /fairness/{roundId}` nach Abschluss | Fairness-API & Round-Datensatz | Runde „SETTLED“ | Server liefert `serverSeed`, Hash und Zeitstempel zur Offline-Verifikation | 100 % der settled Runden liefern Matching Hash & Seed | Hoch | Mittel |
| Performance | 100 parallele Sessions | `POST /round/start` | Round-Start-Endpunkt | Normalbetrieb mit produktionsnaher Datenbank | Antworten bleiben schnell und vollständig | p95 < 300 ms, keine Timeouts | Hoch | Mittel |
| Sicherheit (Zugriffsschutz) | Angreifer:in | 200 Login-Versuche/min mit falschen Credentials | Auth-API (`/auth/login`,`/auth/refresh`) | Normalbetrieb | Rate-Limiter sperrt Identität/IP nach 10 Fehlversuchen, Fehlermeldungen bleiben generisch | Max. 10 Fehlversuche/5 min pro IP oder Email | Hoch | Hoch |
| Wartbarkeit / Modifizierbarkeit | Entwickler:in | Neue Sidebet-Regel wird implementiert | Round-Modul (Engine + Tests) | Design-/Implementierungsphase | Änderungen bleiben auf Domäne beschränkt und sind testbar | < 2 Dateien außerhalb `modules/round` betroffen, Tests bestehen | Mittel | Mittel |
| Verfügbarkeit & Beobachtbarkeit | On-Call | Supportticket verlangt Ursachenanalyse | `/metrics` + strukturierte Logs | Produktion, Monitoring aktiviert | Telemetrie & Logs liefern Request-IDs, Fehler- & Latenzwerte | 100 % Requests mit `X-Request-Id`, `/metrics` antwortet <1 s | Mittel | Niedrig |

## Schritt 3 - Abgeleitete Architecture Significant Requirements
| ASR | Beschreibung | Begründung (aus Schritt 1+2) | Technische Umsetzung |
| --- | --- | --- | --- |
| ASR-1 Deterministische Spielengine | Kartenmischung & Spielstatus laufen ausschließlich im Backend. Jede Runde persistiert `serverSeed`, `serverSeedHash`, Aktionen und Resultate. | Zuverlässigkeit & Integrität: Nur so lassen sich Ergebnisse auditieren und erneut laden. | `round.controller.ts` generiert Seeds, `fairness.controller.ts` liefert sie aus; RNG basiert auf Fisher-Yates + SHA-256 (siehe `fairness.utils.ts`). |
| ASR-2 Atomare Wallet-Buchungen | Einsätze, Gewinne und Power-Up-Käufe sind atomar – kein State darf bei Fehlern halb geschrieben werden. | Betreiber-Ziele & Zuverlässigkeitsszenario UT-R1. | TypeORM-Transaktionen (`AppDataSource.transaction`) bündeln Wallet-Updates, Rundenstatus und Inventory, pessimistic locking auf User/Wallet. |
| ASR-3 Gesicherter Auth-Flow | JWTs sichern APIs; Refresh-Tokens liegen in HttpOnly+Secure Cookies und werden serverseitig gehärtet. Rate-Limiter schützt Auth-Routen. | Sicherheits-Szenario UT-S2. | `auth.controller.ts` hasht Refresh-Tokens (`hashToken`), Sessions speichern User-Agent/IP; `globalRateLimiter`/`authRateLimiter`, `apiKeyGuard`. |
| ASR-4 Auditierbare Fairness-Schnittstelle | Settled Runden müssen vollständig reproduzierbar sein (Seed + Hash + Draw Order). | Sicherheits-Szenario UT-S1 (Integrität & Auditierbarkeit). | `fairness.controller.ts`, `fairness.utils.ts`, persistente Seeds pro Round, GET `/fairness` inklusive ServerSeed & Hash. |
| ASR-5 Performante API & SPA | Round-Start-Flow bleibt performant trotz Sidebets & Power-Ups. | Performance-Szenario UT-P1. | Ressourcensparende DTOs, Pagination (`leaderboard`, `fairness`), Indizes auf Round/User, Node.js Async I/O, Angular lazy loading. |
| ASR-6 Diagnostizierbarkeit & Betrieb | Jede Anfrage erhält `X-Request-Id`, Logs sind strukturiert, `/metrics` liefert Snapshots. Feature-Toggles schützen Docs & Metrics. | Verfügbarkeit/Beobachtbarkeit UT-O1. | `observability/metrics.ts`, `requestContext` Middleware, `setupSwagger` + API-Key-Guards, Feature-Flags `METRICS_ENABLED`/`DOCS_ENABLED`. |
| ASR-7 Modular ausbaubare Domänen | Neue Features (Leaderboard, Rewards, XP) dürfen bestehende Module kaum berühren. Jede Domäne besitzt Router, Controller, Schemata. | Wartbarkeitsszenario UT-M1 & Teamziele. | Ordner pro Modul (`modules/*`), Zod-Schemata für Input, TypeORM Entities pro Aggregat, Angular Feature-Module spiegeln Backend-Domänen. |

Die ASR bilden die Leitplanken für Entwurfsentscheidungen und verlinken zurück auf Ziele und Szenarien. Vor jeder größeren Änderung prüfen wir, ob eine ASR betroffen ist und ob zusätzliche Taktiken oder Patterns nötig werden.
