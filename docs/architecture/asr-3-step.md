# Architecture Significant Requirements (ASR)

Dieses Dokument folgt dem 3-Schritte-Ansatz aus der Vorlesung. Ausgehend von Geschäftszielen und Stakeholder-Interessen (Schritt 1) werden die kritischsten Qualitätsattribute samt Szenarien bestimmt (Schritt 2), bevor daraus konkrete Architecture Significant Requirements abgeleitet werden (Schritt 3).

## Schritt 1 - Geschäfts- und Stakeholderziele
| Treiber | Beschreibung | Architektur-Auswirkung |
| --- | --- | --- |
| Spieler:innen wollen jederzeit faire Blackjack-Runden mit nachvollziehbaren Ergebnissen erleben. | Rundenlogik, Kartengenerierung und Auszahlungen müssen serverseitig deterministisch und einsehbar sein. | Backend kontrolliert RNG und stellt ein Fairness-API für Auditierung bereit; keine Logik im Client, konsequente Persistenz aller Schritte. |
| Betreiber:in benoetigt ein betrugssicheres Wallet ohne Echtgeld, aber mit exakten Buchungen. | Einsätze, Sidebets, Power-Ups und Rewards berühren das Wallet und dürfen nie doppelt oder verloren werden. | Transaktionen und Sperren in der Datenbank, Validierung vor jedem State-Change, zentrale Wallet-Services. |
| Das Entwicklerteam muss Features schnell liefern, testen und deployen koennen. | Wartbarkeit, Modularität, automatisierte Tests sowie Docker-basierte Umgebung sind Pflicht. | Layered Express/TypeORM-Architektur, Feature-Module, CI/CD-Pipelines, Infrastructure-as-Code. |
| Compliance/Security verlangt Schutz personenbezogener Daten (Email, Tokens) und Resilienz gegen Missbrauch. | Authentifizierung, Sessions und Rate-Limiting müsen Standards folgen; Geheimnisse dürfen nicht ins Repo. | JWT + Refresh-Cookies, verschlüsselte Hashes, Rate-Limiter, Secrets via `.env`. |
| Produktmanagement erwartet Responsive SPA mit <2 s Time-to-interact und 95 % API-Responses <300 ms. | Performance-Ziele beeinflussen Technologie-Stack, Datenmodellierung und API-Design. | Angular Single-Page-Frontend, schlanke JSON-APIs, indizierte Tabellen, asynchrone I/O im Backend. |

## Schritt 2 - Kritische Qualitätsattribute & Szenarien
Die wichtigsten Qualitätsattribute stammen direkt aus dem SRS (Kapitel 3.2-3.5). Die Tabelle legt konkrete Szenarien (Stimulus, Umgebung, Response) fest und ordnet Business-Priorität (BP) sowie Risiko (R) zu.

| Attribut | Szenario (Stimulus -> Response) | BP | R |
| --- | --- | --- | --- |
| Zuverlässigkeit / Datenkonsistenz | Wärend eines Rundenergebnisses fällt der Browser aus -> Nach Reload zeigt das Backend den letzten Stand, Einsätze sind maximal einmal gebucht. | Hoch | Mittel |
| Fairness & Transparenz | Spieler fragt `/fairness/{roundId}` ab -> Server liefert Hash & ServerSeed, womit er die Kartenfolge offline reproduzieren kann. | Hoch | Niedrig |
| Performance | 100 gleichzeitige Sessions starten eine Runde -> 95 % der `/round/start` Antworten bleiben <300 ms und enthalten nur benoetigte Felder. | Hoch | Mittel |
| Sicherheit | Angreifer versucht 200 Login-Anfragen pro Minute -> Rate-Limiter blockiert zusätzliche Requests nach 10 Fehlversuchen/IP und verschleiert Fehlermeldungen. | Hoch | Hoch |
| Wartbarkeit | Neue Sidebet-Regel wird ergänzt -> Änderungen bleiben auf Modul-Ebene (Round + Sidebet-Engine) ohne Anpassungen in Auth oder Wallet. | Mittel | Mittel |
| Beobachtbarkeit | On-Call braucht Ursache für Supportticket -> `GET /metrics` und strukturierte Logs zeigen Requests, Fehlercodes und Latenzen mit `X-Request-Id`. | Mittel | Niedrig |

## Schritt 3 - Abgeleitete Architecture Significant Requirements
| ASR | Beschreibung | Begründung (aus Schritt 1+2) | Technische Umsetzung |
| --- | --- | --- | --- |
| ASR-1 Deterministische Spielengine | Kartenmischung & Spielstatus laufen ausschliesslich im Backend. Jede Runde persistiert `serverSeed`, `serverSeedHash`, Aktionen und Resultate. | Faire, nachvollziehbare Spielerfahrung (Vision, Zuverlässigkeit). | `round.controller.ts` generiert Seeds, `fairness.controller.ts` liefert sie aus; RNG basiert auf Fisher-Yates + SHA-256 (siehe `fairness.utils.ts`).
| ASR-2 Atomare Wallet-Buchungen | Einsätze, Gewinne und Power-Up-Käufe sind atomar - kein State darf bei Fehlern halb geschrieben werden. | Betreiber-Ziele & SRS 3.3 (Datenkonsistenz). | TypeORM-Transaktionen (`AppDataSource.transaction`) bündeln Wallet-Updates, Rundenstatus und Inventory.
| ASR-3 Gesicherter Auth-Flow | JWTs sichern APIs; Refresh-Tokens liegen in HttpOnly+Secure Cookies und werden serverseitig gehärtet. Rate-Limiter schützt Auth-Routen. | Compliance/Security-Treiber, Qualitätsmerkmal Sicherheit. | `auth.controller.ts` hasht Refresh-Tokens (`hashToken`), Sessions speichern User-Agent/IP; `apiKeyGuard` + `rateLimiters.ts` decken Missbrauch.
| ASR-4 Performante API & SPA | Frontend bleibt als Angular-SPA <300 kB gzip und trifft schlanke REST-Endpunkte mit <300 ms p95. | Produktziel Time-to-interact, Performance-Attribut. | Ressourcensparende DTOs, Pagination (`leaderboard`, `fairness`), Indizes auf Round/User, Node.js Async I/O, Angular lazy loading.
| ASR-5 Diagnostizierbarkeit & Betrieb | Jede Anfrage erhält `X-Request-Id`, Logs sind strukturiert, `/metrics` liefert Snapshots. Feature-Toggles schützen Docs & Metrics. | Supportability (3.5), On-Call/Stakeholder-Anforderungen. | `observability/metrics.ts`, `requestContext` Middleware, `setupSwagger` + API-Key-Guards.
| ASR-6 Modular ausbaubare Domänen | Neue Features (Leaderboard, Rewards, XP) duerfen bestehende Module kaum berühren. Jede Domäne besitzt Router, Controller, Schemata. | Teamziele bzgl. Wartbarkeit & Erweiterbarkeit. | Ordner pro Modul (`modules/*`), Zod-Schemata für Input, TypeORM Entities pro Aggregat, Angular Feature-Module spiegeln Backend-Domänen.

Die ASR bilden die Leitplanken fuer Entwurfsentscheidungen und verlinken zurück auf Ziele und Szenarien. Vor jeder groesseren Änderung prüfen wir, ob eine ASR betroffen ist und ob zusätzliche Taktiken oder Patterns noetig werden.
