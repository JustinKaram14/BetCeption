# BetCeption

# Test Plan

## Version 1.2

---

## Seit dem letzten Stand

Folgendes ist seit dem letzten Stand dazugekommen bzw. implementiert worden:

- **CI/CD-Pipeline**: GitHub Actions (`ci.yml`) führt bei jedem Pull Request auf `main`/`develop` und bei jedem Push auf `main` automatisch alle Backend- und Frontend-Tests aus. Ein dedizierter Gate-Job `All Tests Pass` blockiert den Merge, solange auch nur ein Test fehlschlägt. Der Deploy-Workflow (`deploy-branch.yml`) baut den Frontend-Dist und veröffentlicht ihn nur bei erfolgreichem Push auf `main`.
- **Abmelde-Button**: Der Nutzer kann sich nun explizit ausloggen; der vollständige Logout-Flow (POST `/auth/logout` + Session-Clear) ist in `auth.spec.ts` abgedeckt.
- **Credentials-Persistenz**: Login-Daten bleiben nach einem Seitenreload erhalten; der Nutzer muss sich nicht erneut anmelden. Die zugrundeliegende TokenStorage-Logik ist in `token-storage.spec.ts` getestet.
- **Spieleanleitung**: Eine HowToPlay-Ansicht wurde ergänzt; der Übersetzungsschlüssel `common.howToPlay` ist im i18n-Service für alle Sprachen verankert.
- **Mehrsprachigkeit (i18n)**: Die Anwendung unterstützt jetzt Deutsch, Englisch, Französisch und Spanisch über einen dedizierten `i18n`-Service mit dem Typen `LanguageCode = 'de' | 'en' | 'es' | 'fr'`.
- **Verbesserte Sicherheitswarnung**: Die Sicherheitswarnung im Frontend wurde überarbeitet und gibt dem Nutzer eine klarere, aussagekräftigere Rückmeldung bei sicherheitsrelevanten Ereignissen.
- **Diverse Bugfixes**: Kleinere Korrekturen in verschiedenen Komponenten und Services.
- **Docker-Build-Fix (Multi-Stage Dockerfile)**: Das Backend-Dockerfile wurde von einem Single-Stage- auf ein Multi-Stage-Build-Verfahren umgestellt (`Betception-Backend/Dockerfile`). Die neue Builder-Stage installiert alle Abhängigkeiten einschließlich DevDependencies (`npm install --include=dev`) und führt den TypeScript-Compiler aus. Die anschließende Production-Stage kopiert nur das kompilierte `dist/`-Verzeichnis und installiert ausschließlich Produktionsabhängigkeiten (`npm ci --omit=dev`). Damit wird das zuvor auftretende `sh: 1: tsc: not found`-Problem (exit code 127 beim Build) dauerhaft behoben und gleichzeitig eine schlanke Produktions-Image-Größe sichergestellt.
- **Entrypoint-CRLF-Fix**: Das Skript `docker-entrypoint.sh` enthielt Windows-CRLF-Zeilenenden (`\r\n`), was auf Linux-Containern dazu führte, dass Bash alle Befehle mit einem angehängten `\r` aufrief und diese als unbekannte Kommandos interpretierte (exit code 127 zur Laufzeit). Die Datei wurde auf reine LF-Zeilenenden konvertiert. Zusätzlich wurde im Dockerfile ein `sed -i 's/\r$//'`-Schritt vor dem `chmod +x` ergänzt, sodass zukünftige Windows-Edits das Problem nicht erneut einbringen können.
- **Performance-Testumgebung funktionsfähig**: Die dedizierte k6-Lasttest-Infrastruktur (`Betception-Backend/docker-compose.perf.yml`) ist durch die obigen Fixes nun vollständig lauffähig. Die Umgebung startet MySQL (`db-perf`), baut und startet das Backend (`backend-perf` auf Port 3001) und führt k6-Szenarien als kurzlebige Docker-Container aus (`grafana/k6:latest`). Eine lokale k6-Installation ist nicht erforderlich.

---

## Inhaltsverzeichnis

1. [Introduction](#1-introduction)  
   1.1 [Purpose](#11-purpose)  
   1.2 [Background](#12-background)  
   1.3 [Scope](#13-scope)  
   1.4 [Project Identification](#14-project-identification)  
2. [Requirements for Test](#2-requirements-for-test)  
3. [Test Strategy](#3-test-strategy)  
   3.1 [Testing Types](#31-testing-types)  
      3.1.1 [Data and Database Integrity Testing](#311-data-and-database-integrity-testing)  
      3.1.2 [Function Testing](#312-function-testing)  
      3.1.3 [Business Cycle Testing](#313-business-cycle-testing)  
      3.1.4 [User Interface Testing](#314-user-interface-testing)  
      3.1.5 [Performance Profiling](#315-performance-profiling)  
      3.1.6 [Load Testing](#316-load-testing)  
      3.1.7 [Stress Testing](#317-stress-testing)  
      3.1.8 [Volume Testing](#318-volume-testing)  
      3.1.9 [Security and Access Control Testing](#319-security-and-access-control-testing)  
      3.1.10 [Failover and Recovery Testing](#3110-failover-and-recovery-testing)  
      3.1.11 [Configuration Testing](#3111-configuration-testing)  
      3.1.12 [Installation Testing](#3112-installation-testing)  
   3.2 [Tools](#32-tools)  
4. [Resources](#4-resources)  
   4.1 [Roles](#41-roles)  
   4.2 [System](#42-system)  
5. [Project Milestones](#5-project-milestones)  
6. [Deliverables](#6-deliverables)  
   6.1 [Test Model](#61-test-model)  
   6.2 [Test Logs](#62-test-logs)  
   6.3 [Defect Reports](#63-defect-reports)  
7. [Appendix A: Project Tasks](#7-appendix-a-project-tasks)

---

# Test Plan

<a id="1-introduction"></a>
# 1. Introduction

<a id="11-purpose"></a>
## 1.1 Purpose

Dieses Testplan-Dokument für BetCeption dient der Erreichung folgender Ziele:

- Identifikation der vorhandenen Projektinformationen, Testartefakte und getesteten Software-Komponenten auf Basis des Repositories, der SRS und der technischen Dokumentation `(bereits implementiert)`.
- Beschreibung der aktuellen Testanforderungen aus Backend, Frontend, Middleware, Integrations- und Utility-Tests mit 23 Backend-Testdateien, 23 Frontend-Spec-Dateien, 78+ Backend-Testfällen und 37 Frontend-Testfällen.
- Empfehlung und Beschreibung der Teststrategie für bereits vorhandene und künftig noch zu ergänzende Testarten `(teilweise bereits implementiert / teilweise noch nicht implementiert)`.
- Benennung der benötigten Ressourcen, Werkzeuge und Testumgebungen für die Weiterführung der Testaktivitäten `(teilweise bereits implementiert / teilweise noch nicht implementiert)`.
- Definition der zu liefernden Testartefakte wie Testmodell, Testprotokolle und Defect Reports auf Basis des aktuellen Projektstands `(teilweise bereits implementiert / teilweise noch nicht implementiert)`.

<a id="12-background"></a>
## 1.2 Background

BetCeption ist eine browserbasierte Casino-Anwendung mit Fokus auf Blackjack, Wallet-Management, Authentifizierung, Daily Rewards, Leaderboards, Shop/Inventory und Power-Ups. Die fachliche Grundlage ist in der Datei `docs/use-cases/software-requirement-specification.md` beschrieben; dort werden sowohl MVP-Funktionen als auch zeitlich offene Erweiterungen dokumentiert `(bereits implementiert als Dokumentation)`.

Architektonisch besteht das System aus einem Angular-Frontend und einem Node.js/Express-Backend mit TypeORM und MySQL 8. Das Backend nutzt REST-Endpunkte, JWT-basierte Authentifizierung, Refresh-Token-Cookies, Middleware für Validierung und Zugriffsschutz sowie persistente Entitäten für Runden, Wallet, Sessions, Rewards und Leaderboards `(bereits implementiert)`.

Die aktuelle Testlandschaft deckt vor allem Unit-, komponentennahe und controllernahe Tests ab. Im Backend werden Controller, Middleware, Utility-Funktionen und ein Integrations-Endpunkt mit Jest, ts-jest und Supertest geprüft. Im Frontend werden Angular-Komponenten, Services, Guards, Interceptors und Pipes mit Jasmine/Karma getestet `(bereits implementiert)`.

Inhaltlich zeigen die Tests eine klare Konzentration auf Kernprozesse wie Registrierung, Login, Token-Handling, Wallet-Buchungen, Power-Up-Kauf und -Verbrauch, Daily Rewards, Leaderboard-Daten, Fairness-Historie sowie den Start und die Abwicklung von Blackjack-Runden. Zusätzlich existieren erste UI-nahe Spezifikationen für Homepage, Leaderboard und Daily-Reward-Modal `(bereits implementiert)`.

<a id="13-scope"></a>
## 1.3 Scope

Dieser Testplan adressiert die Teststufen Unit Test, Component Test, Controller/API Test und einen kleinen Integrationsumfang für den Health-Endpunkt `(bereits implementiert)`. Systematische End-to-End-, Performance-, Recovery- und Installations-Tests sind fachlich vorgesehen, im aktuellen Repository aber nicht als Testautomatisierung vorhanden `(noch nicht implementiert)`.

**Funktionen, die durch vorhandene Tests abgedeckt werden:**

- Backend-Authentifizierung: Registrierung, Login, Refresh, Logout, JWT-Erzeugung und Middleware-Schutzmechanismen.
- Backend-Wallet: Kontostand, Transaktionshistorie, Einzahlung, Auszahlung und Fehlerfälle bei unzureichendem Guthaben .
- Backend-Gameplay: Rundenstart, Hit, Stand, Settlement, Fairness-Helfer, Fairness-Historie und Daily Rewards .
- Backend-Shop und Inventory: Auflisten, Kaufen, Verbrauch und Besitzprüfung von Power-Ups.
- Backend-Middleware und Utilities: Request-Validierung, Error Handling, 404, API-Key-Guard, Auth-Guard, Rate Limiting, Passwort-, Geld- und Token-Utilities.
- Frontend-Core und UI: App, Auth, Guard, Interceptor, Token Storage, Http-Client-Service, Wallet/RNG-Services, gemeinsame UI-Komponenten und Pipes.
- Frontend-Feature-Komponenten: Login, Register, Verify Email, Homepage, Blackjack-Page, Leaderboard, Daily Reward Modal und CardGuess (RiskUp-Feature).
- Abmelde-Button und vollständiger Logout-Flow inkl. Session-Clear (`auth.spec.ts`).
- Credentials-Persistenz bei Seitenreload über TokenStorage (`token-storage.spec.ts`).
- Internationalisierung (i18n) mit DE/EN/ES/FR über dedizierten i18n-Service.
- Spieleanleitung (HowToPlay) als Übersetzungsschlüssel `common.howToPlay` im i18n-Service verankert.

**Funktionen, die aktuell nicht oder nicht ausreichend automatisiert getestet werden:**

- Komplette Ende-zu-Ende-Nutzerflüsse über Browser und Backend hinweg.
- Leistungs-, Last-, Stress- und Volumentests unter realistischen Parallelzugriffen.
- Failover-, Recovery- und Installationsszenarien auf Infrastruktur- oder Deployment-Ebene.
- Systematische Multi-Browser- und Multi-Geräte-Konfigurationstests.

**Annahmen:**

- Die SRS, Use Cases, UCRS-Dokumente und Architekturartefakte repräsentieren den beabsichtigten Funktionsumfang ausreichend für diesen Testplan.
- Die vorhandenen Testdateien spiegeln den aktuell maßgeblichen Qualitätssicherungsstand wider.
- Frontend-Tests werden mit Angular/Karma/Jasmine ausgeführt, Backend-Tests mit Jest/Supertest/ts-jest; weitere spezialisierte Testwerkzeuge sind derzeit nicht im Projekt konfiguriert.

**Risiken und Eventualitäten:**

- Die Diskrepanz zwischen dokumentiertem Use-Case-Umfang und tatsächlich automatisierter Testabdeckung kann zu unentdeckten Lücken führen, insbesondere bei System- und Nichtfunktionstests.
- DB-nahe Controller-Tests mit Mocks oder kontrollierten Datenquellen erkennen nicht automatisch alle Infrastruktur- oder Migrationsprobleme in produktionsnahen Umgebungen.
- Frontend-Specs mit Fokus auf Komponentenerstellung bieten nur begrenzte Aussagekraft über reales Nutzerverhalten und Cross-Browser-Kompatibilität.

**Constraints:**

- Es existiert aktuell keine im Repository sichtbare E2E-Suite, kein dediziertes Performance-Framework und keine formale Testmanagement-Datenbank.

<a id="14-project-identification"></a>
## 1.4 Project Identification

In der folgenden Tabelle sind die für die Erstellung des Testplans herangezogenen Unterlagen und deren Verfügbarkeit aufgeführt:

| Document (and version / date) | Created or Available | Received or Reviewed | Author or Resource | Notes |
|---|---|---|---|---|
| Requirements Specification, Software Requirements Specification, v1.0, 08.12.2025 | Yes | Yes | Team BetCeption | Quelle: `docs/use-cases/software-requirement-specification.md` |
| Functional Specification | No | No | N/A | / |
| Use-Case Reports | Yes | Yes | Team BetCeption | Use-Case-Dateien UC1 bis UC10 unter `docs/use-cases` vorhanden |
| Project Plan | No | No | N/A | / |
| Design Specifications | Yes | Yes | Team BetCeption | SAD, Architecture Decisions, Utility Tree und weitere Architekturartefakte unter `docs/architecture` |
| Prototype | Yes | Yes | Team BetCeption | Wireframes und Mockups unter `docs/assets` vorhanden |
| User’s Manuals | No | No | N/A | / |
| Business Model or Flow | Yes | Yes | Team BetCeption | Use-Case-Realisationen und Ablaufbeschreibungen vorhanden |
| Data Model or Flow | Yes | Yes | Repository / Team BetCeption | `db/schema.sql`, TypeORM-Entities und Klassendiagramm vorhanden |
| Business Functions and Rules | Yes | Yes | Team BetCeption | SRS, Use Cases und Controller-/Fairness-Tests beschreiben und validieren Geschäftsregeln |
| Project or Business Risk Assessment | Yes | Yes | Team BetCeption | `docs/RMMM/rmmm-table.md` vorhanden |

<a id="2-requirements-for-test"></a>
# 2. Requirements for Test

Die folgende Auflistung enthält jene Elemente – Anwendungsfälle, funktionale Anforderungen und nicht-funktionale Anforderungen –, die als Testobjekte identifiziert wurden. Diese Liste gibt wieder, was getestet wird.

- Authentifizierung und Session-Management: Registrierung, Login, Refresh, Logout, Auth Guards, API-Key-Schutz und Token-Utilities `(bereits implementiert)`.
- Wallet- und Geldlogik: Kontostand, Transaktionen, Ein- und Auszahlungen, Geldkonvertierung und Buchungskonsistenz in fachlichen Happy- und Error-Pfaden `(bereits implementiert)`.
- Blackjack-Rundenlogik: Rundenstart, Hit, Stand, Settlement, aktive Runde sowie deterministische Fairness-Decklogik `(bereits implementiert)`.
- Spielnahe Zusatzfunktionen: Power-Up-Kauf, Power-Up-Verbrauch, Inventory, Daily Rewards und Leaderboard-Daten `(bereits implementiert)`.
- Robustheit der HTTP-Schicht: Request-Validierung, Fehlerformatierung, 404-Verhalten und Health-Endpunkt `(bereits implementiert)`.
- Frontend-Anwendungsbasis: Rendering der App, Auth-Services, Guard/Interceptor, Token Storage, HTTP-Client, Wallet/RNG-Services, gemeinsame UI-Bausteine und Pipes `(bereits implementiert)`.
- Frontend-Feature-Oberflächen: Auth-Seiten, Homepage, Blackjack-Page, Leaderboard-Komponente, Daily-Reward-Modal und Event-Handling zwischen Komponenten `(bereits implementiert)`.
- Nichtfunktionale Anforderungen zu Leistung, Wiederherstellung, Installation, Konfiguration und Lastverhalten sollen künftig mit dedizierten Tests ergänzt werden `(noch nicht implementiert)`.

<a id="3-test-strategy"></a>
# 3. Test Strategy

Die Teststrategie orientiert sich am tatsächlich vorhandenen Testbestand und erweitert ihn um die im Projektkontext sinnvollen, aber noch fehlenden Testarten. Bestehende Tests sichern vor allem fachliche Logik, API-Verhalten, Eingabevalidierung und zentrale UI-Komponenten ab `(bereits implementiert)`. Nicht vorhandene Testarten werden in diesem Dokument als empfohlene Ergänzung beschrieben, damit aus dem aktuellen Unit-/Controller-Fokus ein vollständigerer Qualitätssicherungsansatz entstehen kann `(noch nicht implementiert)`.

<a id="31-testing-types"></a>
## 3.1 Testing Types

<a id="311-data-and-database-integrity-testing"></a>
### 3.1.1 Data and Database Integrity Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Absicherung von Datenkonsistenz, korrekten Persistenzabläufen und fehlender Datenkorruption bei Wallet-, Session-, Reward-, Round- und Inventory-bezogenen Operationen. Controller-Tests validieren fachliche Persistenzpfade bereits indirekt über Repository-Mocks. Darüber hinaus existiert nun eine vollständige DB-Integritäts-Testsuite, die einen echten MySQL-8-Container via `testcontainers` startet und alle Migrationen ausführt. |
| Technique | - Controller-Tests mit kontrollierten Repository-Doubles für valide und invalide Daten (Auth, Wallet, Rewards, Shop, Powerups, Round, Fairness). - DB-Integritätstests in `tests/integration/db-integrity.test.ts` gegen einen echten MySQL-Container: Unique Constraints auf `email`, `username`, `refresh_token` und `(user_id, claim_date)`; CASCADE DELETE für Sessions, WalletTransactions und DailyRewardClaims; Persistenz aller `WalletTransactionKind`-Werte und Dezimalpräzision. |
| Completion Criteria | Alle DB-Zugriffsmethoden und fachlichen Persistenzprozesse liefern den erwarteten Zustand ohne Inkonsistenzen. Die DB-Integritätstests laufen gegen eine echte MySQL-Instanz und sind in der CI/CD-Pipeline integriert. |
| Special Considerations | Das `testcontainers`-Paket ist als devDependency installiert und wird in `db-integrity.test.ts` genutzt. Docker muss dafür auf dem Entwicklungsrechner und in der CI-Umgebung verfügbar sein. Die Tests benötigen ca. 30–60 Sekunden für den Container-Start; das Jest-Timeout ist auf 120 Sekunden gesetzt. |

<a id="312-function-testing"></a>
### 3.1.2 Function Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Sicherstellung der korrekten Fachfunktionalität in Backend und Frontend, inklusive Dateneingabe, Verarbeitung, Rückgabe, Statuscodes, Fehlermeldungen und UI-Reaktionen. Dies ist die am stärksten ausgebaute Testart im Projekt `(bereits implementiert)` |
| Technique | - Backend-Controller-Tests mit validen und invaliden Eingaben für Auth, User, Wallet, Shop, Inventory, Powerups, Rewards, Leaderboard, Fairness und Round ausführen `(bereits implementiert)`  Middleware- und Utility-Tests für Request-Validierung, Fehlerbehandlung, Authentifizierung, API-Key-Checks, Rate Limiting sowie Geld-, Passwort- und Token-Helfer ausführen `(bereits implementiert)` Frontend-Specs für Services, Guards, Interceptor, Pipes und Feature-Komponenten mit Fokus auf Rendering, Mapping, Event-Handling und Fehlerszenarien ausführen `(bereits implementiert)`  Nicht abgedeckte Use Cases wie vollständige Sidebet-End-to-End-Flows oder kombinierte Frontend-Backend-Happy-Paths sollten zusätzlich als systematische Funktionssuiten ergänzt werden `(noch nicht implementiert)` |
| Completion Criteria | - Alle geplanten funktionalen Tests für vorhandene Module laufen erfolgreich durch `(bereits implementiert als Ziel, tatsächlicher Lauf für diesen Testplan wurde nicht neu ausgeführt)`  Alle identifizierten Defekte sind dokumentiert und entweder behoben oder bewusst priorisiert `(teilweise bereits implementiert / formaler Defect-Workflow nicht sichtbar)` |
| Special Considerations | Ein Teil der Frontend-Specs prüft aktuell nur Komponentenerstellung; dort sollte die fachliche Tiefe weiter erhöht werden. Umgekehrt zeigen neue Tests wie Homepage, Leaderboard und Daily Reward Modal bereits konkreteres UI-Verhalten und sollten als Qualitätsniveau für weitere Komponenten dienen `(teilweise bereits implementiert)` |

<a id="313-business-cycle-testing"></a>
### 3.1.3 Business Cycle Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Prüfung, dass zeit- und zyklusabhängige Fachprozesse wie Daily Rewards, Session-Abläufe, Leaderboard-Zeitfenster und wiederholte Spielrunden über längere Nutzungsperioden korrekt funktionieren. Aktuell ist dies nur punktuell über Daily-Reward- und Leaderboard-Logik abgedeckt `(teilweise bereits implementiert)` |
| Technique | - Bestehende Tests für Rewards, Leaderboards, Sessions und Runden iterativ mit variierenden Zeitpunkten, Datumsgrenzen und Mehrfachausführungen erweitern `(noch nicht implementiert als eigenständige Zyklus-Testserie)` Daily-Reward-Claims über mehrere Tage simulieren, Cooldown-Grenzen prüfen und Leaderboard-Snapshots für Wochenwechsel validieren `(teilweise bereits implementiert / vollständig noch nicht implementiert)`  Mehrfaches Starten, Fortsetzen und Abschließen von Runden pro Nutzer simulieren, um Langzeitkonsistenz von Wallet, XP und Historienobjekten zu prüfen `(noch nicht implementiert als Business-Cycle-Suite)` |
| Completion Criteria | - Alle geplanten Zeit- und Zyklus-Szenarien sind erfolgreich ausgeführt `(noch nicht implementiert)`  Alle identifizierten Defekte in periodischen Geschäftsregeln wurden adressiert `(noch nicht implementiert)` |
| Special Considerations | - Daily Reward und Session-Abläufe benötigen kontrollierbare Systemzeit oder Clock-Abstraktionen `(noch nicht implementiert)`   Für wöchentliche Leaderboards ist ein klar dokumentiertes Kalenderschema erforderlich `(teilweise bereits implementiert / teststrategisch noch nicht vollständig umgesetzt)` |

<a id="314-user-interface-testing"></a>
### 3.1.4 User Interface Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Verifikation von Navigation, Anzeigezuständen, Interaktionen und korrekter Darstellung von UI-Komponenten. Dafür existieren bereits Angular-Komponenten- und Seiten-Specs, insbesondere für Homepage, Leaderboard, Daily Reward Modal und Blackjack-Ansicht `(bereits implementiert)` |
| Technique | - Vorhandene Angular-Specs zur Prüfung von Rendering, Events, Zustandswechseln und Fehlermeldungen ausführen `(bereits implementiert)`  Zusätzliche DOM-nahe Tests für Tastaturnavigation, Fokusführung, Modal-Verhalten, Responsivität und Zustandswechsel ergänzen `(noch nicht implementiert)`  Spätere E2E-Browser-Tests für echte Routing- und Formular-Flows ergänzen, um die GUI jenseits isolierter Komponenten zu validieren `(noch nicht implementiert)` |
| Completion Criteria | Alle zentralen Fenster, Ansichten und interaktiven Elemente verhalten sich konsistent mit den Mockups, den Angular-Komponentenverträgen und den fachlichen Anforderungen. Für einzelne Komponenten ist dies bereits erreicht, für vollständige UI-Navigationsketten jedoch noch nicht `(teilweise bereits implementiert)` |
| Special Considerations | Die vorhandenen Mockups und Wireframes in `docs/assets` können als Referenz für UI-Abgleiche genutzt werden. Browserübergreifende UI-Verifikation ist im aktuellen Projektstand nicht automatisiert `(teilweise bereits implementiert / teilweise noch nicht implementiert)` |

<a id="315-performance-profiling"></a>
### 3.1.5 Performance Profiling

| Bereich | Inhalt |
|---|---|
| Test Objective | Messung der Antwortzeiten kritischer Transaktionen (Login, Register, Round Start/Hit/Stand/Settle, Wallet Summary, Leaderboard) unter Ramp-Last mit bis zu 20 gleichzeitigen virtuellen Nutzern. |
| Technique | Vier k6-Szenarien in `performance/k6/scenarios/`: **auth-flow.js** (Register + Login, 10 VUs), **game-flow.js** (vollständiger Blackjack-Rundenablauf: Start → Stand → Settle, 10 VUs), **wallet-flow.js** (Deposit + Summary + Transactions, 10 VUs), **leaderboard.js** (alle drei Leaderboard-Endpunkte, 20 VUs). Jedes Szenario misst p(95) über gefilterte Tags (`name:round_start`, `name:login` usw.) und wertet sie gegen die SRS-Ziele aus: < 300 ms für Spielaktionen, < 600 ms für Auth, < 1 % Fehlerrate. |
| Completion Criteria | Alle k6-Threshold-Prüfungen (p95, Fehlerrate, Fehlerzähler) werden bestanden, wenn die Skripte gegen die dedizierte Perf-Umgebung (`docker-compose.perf.yml`) ausgeführt werden. Ergebnisse werden als JSON-Artifacts in CI gespeichert. Die Perf-Umgebung ist nach dem Multi-Stage-Dockerfile-Fix und der CRLF-Korrektur am Entrypoint vollständig lauffähig `(bereits implementiert)`. |
| Special Considerations | Die dedizierte Umgebung (`docker-compose.perf.yml`) exponiert das Backend auf Port 3001, nutzt eine separate MySQL-Datenbank (`betception_perf`) und hebt die Rate-Limits auf (AUTH_RATE_LIMIT_MAX=1000, RATE_LIMIT_MAX=2000). Der GitHub-Actions-Workflow `perf.yml` kann manuell oder automatisch jeden Montag um 03:00 UTC ausgeführt werden. k6 läuft als Docker-Container (`grafana/k6:latest`) innerhalb von `docker-compose.perf.yml` – eine lokale k6-Installation ist nicht erforderlich `(bereits implementiert)`. |

<a id="316-load-testing"></a>
### 3.1.6 Load Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Überprüfung des Systemverhaltens unter variierenden Nutzer- und Transaktionslasten, insbesondere für API-Endpunkte mit hoher Nutzung wie Auth, Round, Wallet und Leaderboard. Im aktuellen Projektstand nicht automatisiert vorhanden `(noch nicht implementiert)` |
| Technique | - Funktionsszenarien für gleichzeitige Logins, Rundenstarts und Wallet-Abfragen in Lastprofile überführen `(noch nicht implementiert)`  Parallelität schrittweise von geringer zu hoher Last steigern und Antwortzeiten, Fehlerraten, DB-Nutzung und CPU/Mem beobachten `(noch nicht implementiert)` |
| Completion Criteria | Mehrfachtransaktionen oder mehrere Benutzer führen nicht zu funktionalen Fehlern und bleiben innerhalb akzeptabler Antwortzeiten. Dieses Kriterium ist derzeit offen `(noch nicht implementiert)` |
| Special Considerations | Load Tests sollten gegen eine isolierte Umgebung mit produktionsnaher MySQL-Konfiguration und realistischer Datengröße laufen. Die SRS nennt mindestens 100 gleichzeitige aktive Sitzungen als Zielwert `(noch nicht implementiert)` |

<a id="317-stress-testing"></a>
### 3.1.7 Stress Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Ermittlung des Verhaltens bei Ressourcenknappheit, hoher Konkurrenz auf Datenbestände und Grenzlasten, insbesondere für Wallet-Buchungen und Rundenzustände. Aktuell nicht als Testserie vorhanden `(noch nicht implementiert)` |
| Technique | - Load-/Performance-Skripte unter reduziertem RAM, eingeschränkten DB-Ressourcen und hoher Gleichzeitigkeit ausführen `(noch nicht implementiert)`  Konkurrierende Requests auf dieselben Nutzer- und Rundenobjekte erzeugen, um Race Conditions und doppelte Buchungen zu identifizieren `(noch nicht implementiert)`  Fehler- und Abbruchbedingungen dokumentieren, insbesondere für Rundensettlement und Wallet-Updates `(noch nicht implementiert)` |
| Completion Criteria | Das System überschreitet definierte Belastungsgrenzen kontrolliert oder arbeitet innerhalb der spezifizierten Limits ohne unzulässige Fehler weiter. Aktuell nicht nachweisbar `(noch nicht implementiert)` |
| Special Considerations | Für diese Testart sind Synchronisationsszenarien auf identische Datensätze und klar definierte Failure-Signaturen erforderlich. Besonders kritisch sind Wallet-Saldo, Session-Rotation und Statuswechsel einer Runde `(noch nicht implementiert)` |

<a id="318-volume-testing"></a>
### 3.1.8 Volume Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Prüfung des Verhaltens bei großen Datenmengen, z. B. umfangreichen Transaktionshistorien, Sessions, Reward-Claims und Leaderboard-Datensätzen. Diese Testart ist aktuell nicht als automatisierte Suite vorhanden `(noch nicht implementiert)` |
| Technique | - Große Seed-Datensätze für `WalletTransaction`, `Round`, `Session` und Leaderboard-Views erzeugen `(noch nicht implementiert)`  Mehrere parallele Lese- und Schreibvorgänge gegen diese Datenmengen fahren und Antwortzeiten, Paging und Speicherverhalten beobachten `(noch nicht implementiert)` |
| Completion Criteria | Große Datenvolumina führen nicht zu Funktionsfehlern und bleiben innerhalb akzeptabler Betriebsgrenzen. Aktuell offen `(noch nicht implementiert)` |
| Special Considerations | Besonders relevant sind paginierte Wallet-Transaktionen, Leaderboards und langfristige Round-/Claim-Historien. Eine klare Definition von „groß“ pro Tabelle muss vor Testbeginn festgelegt werden `(noch nicht implementiert)` |

<a id="319-security-and-access-control-testing"></a>
### 3.1.9 Security and Access Control Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | - Application-level Security: Verifikation, dass nur berechtigte Nutzer Funktionen und Daten sehen bzw. ausführen können. Auth- und API-Key-Schutz, Request-Validierung und Besitzprüfungen sind bereits teilweise getestet `(bereits implementiert)`. Die Sicherheitswarnung im Frontend wurde überarbeitet und gibt dem Nutzer eine klarere, aussagekräftigere Rückmeldung bei sicherheitsrelevanten Ereignissen `(bereits implementiert)`.  System-level Security: Verifikation, dass nur autorisierte Zugänge an das System gelangen und Konfigurationsgrenzen korrekt greifen `(noch nicht implementiert)` |
| Technique | - Vorhandene Tests für `authGuard`, `apiKeyGuard`, `validateRequest`, `rateLimiters` sowie Auth-Controller und Round-/Powerup-Besitzprüfungen ausführen `(bereits implementiert)`  Für jede relevante Rolle bzw. jeden Zugriffskontext Tests auf erlaubte und verweigerte Endpunkte ergänzen, einschließlich Frontend-Guard-Verhalten und Backend-Ownership-Regeln `(teilweise bereits implementiert)` Token-Manipulation, Cookie-Missbrauch, Refresh-Rotation und Header-Missbrauch systematischer mit Negativtests abdecken `(teilweise bereits implementiert / vollständig noch nicht implementiert)`  System-level Access zusammen mit Infrastruktur-/Deployment-Konfiguration prüfen, z. B. Secrets, TLS, Reverse Proxy, CORS, Adminer-Zugriff und DB-Port-Freigaben `(noch nicht implementiert)` |
| Completion Criteria | Für jeden bekannten Zugriffskontext sind nur die zulässigen Funktionen und Daten verfügbar. Applikationsseitig ist dies für zentrale Guards und Ownership-Fälle bereits teilweise abgesichert; systemseitig noch offen `(teilweise bereits implementiert)` |
| Special Considerations | Die SRS verweist auf OWASP ASVS, JWT Best Practices und Datenschutzanforderungen. Für eine vollständige Security-Abdeckung werden zusätzliche Security- und Konfigurationsprüfungen außerhalb der aktuellen Unit-/Controller-Tests benötigt `(teilweise bereits implementiert / teilweise noch nicht implementiert)` |

<a id="3110-failover-and-recovery-testing"></a>
### 3.1.10 Failover and Recovery Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Prüfung, dass Datenbank, Anwendung und System nach Unterbrechungen oder Fehlern in einen definierten konsistenten Zustand zurückkehren. Dafür gibt es im aktuellen Testbestand keine dedizierten Failover- oder Recovery-Suiten `(noch nicht implementiert)` |
| Technique | - Funktionale Transaktionen für Wallet, Round und Session bis zu einem definierten Zwischenzustand ausführen und dann DB-, Netzwerk- oder Prozessunterbrechungen simulieren `(noch nicht implementiert)`  Danach Recovery-Prozeduren und erneute Abfragen ausführen, um Salden, Session-Gültigkeit, aktive Runde und Reward-Zustände zu validieren `(noch nicht implementiert)`  Unterbrochene Zyklen wie Start Round vor Settlement oder Refresh während Session-Rotation als gezielte Fehlerfälle prüfen `(noch nicht implementiert)` |
| Completion Criteria | Nach jedem Recovery-Szenario befinden sich Anwendung und Daten in einem bekannten, konsistenten Zustand; nicht abgeschlossene Vorgänge sind nachvollziehbar protokolliert. Derzeit nicht nachweisbar `(noch nicht implementiert)` |
| Special Considerations | Diese Tests sind invasiv und sollten nur auf isolierten Testsystemen laufen. Docker-Compose mit MySQL und Adminer bietet eine gute Basis für kontrollierte Ausfälle, ist aber noch nicht als Recovery-Testverfahren operationalisiert `(noch nicht implementiert)` |

<a id="3111-configuration-testing"></a>
### 3.1.11 Configuration Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Verifikation, dass BetCeption unter verschiedenen Hardware-, Browser-, Node-, Angular- und Datenbankkonfigurationen korrekt funktioniert. Diese Testart ist im aktuellen Repository nur indirekt durch allgemeine Toolkonfigurationen vorbereitet `(noch nicht implementiert)` |
| Technique | - Vorhandene Funktions- und UI-Tests unter mehreren Browsern und Node-/npm-Versionen ausführen `(noch nicht implementiert)`  Frontend mit unterschiedlichen Viewport-Größen und Browser-Engines prüfen; Backend gegen lokale Docker- und produktionsnahe Konfigurationen validieren `(noch nicht implementiert)`  Zusätzliche Hintergrundsoftware und Speicherdruck simulieren, insbesondere auf Client-Seite für Angular-UI und auf Server-Seite für Node/MySQL `(noch nicht implementiert)` |
| Completion Criteria | Für jede relevante Konfigurationskombination werden die zentralen Transaktionen erfolgreich und ohne Abweichung ausgeführt. Aktuell offen `(noch nicht implementiert)` |
| Special Considerations | Bekannte technische Parameter sind Angular 20, Node/Express, MySQL 8, Docker Compose, Karma/Jasmine und Jest. Welche Browser- und Betriebssystemmatrix offiziell unterstützt wird, ist im Repository nicht vollständig definiert `(teilweise bereits implementiert / teilweise noch nicht implementiert)` |

<a id="3112-installation-testing"></a>
### 3.1.12 Installation Testing

| Bereich | Inhalt |
|---|---|
| Test Objective | Verifikation, dass Backend und Frontend unter Neuinstallation, Wiederinstallation und Update-Szenarien korrekt startbar und funktionsfähig sind. Build- und Startskripte existieren bereits, eine formale Installations-Testserie jedoch nicht `(teilweise bereits implementiert)` |
| Technique | - Neuinstallation mit `npm install` für Backend und Frontend sowie Build-Ausführung validieren `(teilweise bereits implementiert als Skripte, Testserie noch nicht implementiert)`  Docker-basierte Inbetriebnahme mit `docker compose` für DB, Backend und Adminer prüfen `(bereits implementiert als Betriebsartefakt, Installationstest noch nicht implementiert)`  Nach Installation einen Confidence-Test mit Health-Endpunkt, Login, Wallet-Abfrage und Frontend-Start ausführen `(noch nicht implementiert als standardisierte Installations-Suite)` |
| Completion Criteria | BetCeption-Transaktionen laufen nach Installation oder Update fehlerfrei an. Aktuell ist dies mangels formalisierter Installationsprüfung noch nicht vollständig abgesichert `(noch nicht implementiert)` |
| Special Considerations | Als Confidence-Test sollten mindestens `/health`, Registrierung/Login, Wallet Summary, Homepage-Rendering und Round Start ausgewählt werden, weil diese Pfade wesentliche Module berühren. Diese Auswahl ist als Vorschlag definiert `(noch nicht implementiert)` |

<a id="32-tools"></a>
## 3.2 Tools

The following tools will be employed for this project:

|  | Tool | Vendor/In-house | Version |
|---|---|---|---|
| Test Management | YouTrack | JetBrains | Im Repository nicht ausgewiesen; laut SRS genutzt `(bereits implementiert organisatorisch, Versionsstand nicht dokumentiert)` |
| Defect Tracking | YouTrack / GitHub Issues oder PR-Kommentare | JetBrains / GitHub | Im Repository nicht formal konfiguriert; als Arbeitsvorschlag dokumentiert `(teilweise bereits implementiert / formaler Workflow noch nicht implementiert)` |
| ASQ Tool for functional testing | Jest, Supertest, Jasmine, Karma | Open Source | Jest 29.7.0, Supertest 6.3.4, Jasmine 5.x, Karma 6.4.x `(bereits implementiert)` |
| ASQ Tool for performance testing | k6 | Open Source / Grafana | `grafana/k6:latest` Docker-Image; läuft als Container in `docker-compose.perf.yml` – keine lokale Installation nötig `(bereits implementiert)` |
| Test Coverage Monitor or Profiler | Jest Coverage / Karma Coverage | Open Source | Jest `--coverage`, `karma-coverage` ~2.2.0 `(bereits implementiert)` |
| Project Management | YouTrack, GitHub, GitHub Actions | JetBrains / GitHub | GitHub Actions implementiert: `ci.yml` führt Backend- und Frontend-Tests bei jedem PR auf `main`/`develop` und bei jedem Push auf `main` aus; `deploy-branch.yml` erstellt den Deploy-Branch nur bei erfolgreichem Push auf `main`. Ein Merge auf `main` wird durch den Gate-Job `All Tests Pass` blockiert, solange Backend- oder Frontend-Tests fehlschlagen `(bereits implementiert)`. |
| DBMS tools | MySQL 8, Adminer, TypeORM, MySQL Workbench | Oracle / Adminer / Open Source | MySQL 8.0, Adminer latest, TypeORM 0.3.27; Workbench laut SRS genutzt `(bereits implementiert)` |

<a id="4-resources"></a>
# 4. Resources

Dieser Abschnitt beschreibt die empfohlenen Ressourcen für das BetCeption-Testprojekt. 

<a id="41-roles"></a>
## 4.1 Roles

Diese Tabelle zeigt die Personalplanung für das Projekt.

| Role | Minimum Resources Recommended (number of full-time roles allocated) | Specific Responsibilities or Comments |
|---|---|---|
| Test Manager, Test Project Manager | 0.5 | Management- und Priorisierungsverantwortung für Testumfang, Status und Risiken. Im Repository nicht personell zuordenbar; als organisatorische Empfehlung definiert `(noch nicht implementiert als explizite Rolle)` |
| Test Designer | 1.0 | Erstellt Testplan, Testmodell und priorisierte Testfälle. Die Rolle wird faktisch durch die vorhandenen Tests wahrgenommen, aber nicht formell ausgewiesen `(teilweise bereits implementiert)` |
| Tester | 1.0 | Führt Tests aus, wertet Resultate aus, dokumentiert Defekte und validiert Fixes. Aktuelle Testartefakte deuten auf diese Tätigkeit hin, formale Rollenzuweisung ist nicht sichtbar `(teilweise bereits implementiert)` |
| Test System Administrator | 0.25 | Pflegt CI, Testumgebungen, Docker-Compose-Stack und Zugänge. Docker- und Skriptgrundlagen sind vorhanden, explizite Rollenverantwortung nicht sichtbar `(teilweise bereits implementiert)` |
| Database Administrator, Database Manager | 0.25 | Verwaltet Testdatenbank, Migrationen, Seeds und Datenintegritätstests. DB-Schema und Migrationen existieren, standardisierte DBA-Prozesse sind nicht sichtbar `(teilweise bereits implementiert)` |
| Designer | 0.5 | Definiert testbare Klassen, Verträge und Pakete. Die Architektur- und Klassendiagrammdokumente bilden dafür eine Basis `(bereits implementiert als Artefakt, Rolle nicht formal ausgewiesen)` |
| Implementer | 1.0 | Implementiert Testklassen, Specs und Hilfswerkzeuge. Diese Arbeit ist durch die vorhandenen Jest- und Jasmine/Karma-Tests nachweisbar `(bereits implementiert)` |

<a id="42-system"></a>
## 4.2 System

Die folgende Tabelle enthält die Systemressourcen für das Testprojekt.

| Resource | Name / Type |
|---|---|
| Database Server | MySQL 8.0 in Docker Compose; für Tests produktionsnah simuliert |
| Network or Subnet | Lokales Docker-Netzwerk gemäß Compose-Setup|
| Server Name | `db` im Docker-Compose-Setup |
| Database Name | `betception` `(bereits implementiert)` |
| Client Test PC's | Entwicklungsrechner mit Node.js, npm, Angular CLI-fähiger Umgebung und Browser für Karma-Tests |
| Include special configuration requirements | Chrome-/Browser-Unterstützung für Karma, Zugriff auf Docker, Node-/npm-Kompatibilität, Umgebungsvariablen für Backend-Tests |
| Test Repository | GitHub-Repository des Projekts BetCeption |
| Network or Subnet | TBD für zentrale CI-/Shared-Testumgebung; lokal nicht erforderlich `(noch nicht implementiert als dedizierte Testumgebung)` |
| Server Name | TBD; aktuell repositorybasiert ohne separates Testmanagementsystem im Codebestand `(noch nicht implementiert)` |
| Test Development PC's | Lokale Entwicklerarbeitsplätze mit VS Code, Node.js, Docker, optional MySQL Workbench |

<a id="5-project-milestones"></a>
# 5. Project Milestones

Die Tests von BetCeption sollten Testmaßnahmen für jeden der in den vorangegangenen Abschnitten genannten Testbereiche umfassen. Diese werden als umsetzbarer Vorschlag dokumentiert.

| Milestone Task | Effort | Start Date | End Date |
|---|---|---|---|
| Plan Test | 3 PT | 28/Apr/26 | 30/Apr/26 |
| Design Test | 5 PT | 01/May/26 | 07/May/26 |
| Implement Test | 10 PT | 08/May/26 | 21/May/26 |
| Execute Test | 7 PT | 22/May/26 | 01/Jun/26 |
| Evaluate Test | 3 PT | 02/Jun/26 | 04/Jun/26 |

<a id="6-deliverables"></a>
# 6. Deliverables

Die folgenden Deliverables basieren auf dem aktuellen Testbestand und erweitern ihn um organisatorisch sinnvolle Artefakte. Einige davon sind bereits indirekt vorhanden, andere sollten eingeführt werden `(teilweise bereits implementiert / teilweise noch nicht implementiert)`.

<a id="61-test-model"></a>
## 6.1 Test Model

Das Testmodell besteht aktuell aus den im Repository vorhandenen Jest- und Jasmine/Karma-Testdateien, den Testhilfen sowie den testbaren Modulgrenzen in Backend und Frontend `(bereits implementiert)`. Ergänzend sollte ein explizites Mapping zwischen Use Cases, SRS-Anforderungen und Testdateien gepflegt werden, damit Coverage pro Fachanforderung nachvollziehbar ist `(noch nicht implementiert)`.

Zu erzeugende bzw. zu pflegende Artefakte:

- Repository-basierte Test-Suites für Backend und Frontend.
- Coverage-Reports aus Jest und Karma Coverage.
- Anforderungs-zu-Test-Matrix pro Use Case und Modul.
- Erweiterte Nichtfunktionstest-Skripte für Performance, Load, Recovery und Installation.

<a id="62-test-logs"></a>
## 6.2 Test Logs

Testergebnisse werden derzeit primär über Konsolenausgaben der Testframeworks, Coverage-Reports und CI-Ausgaben erfasst. Die GitHub-Actions-Pipeline (`ci.yml`) lädt Coverage-Reports als Artefakte hoch (Aufbewahrung: 7 Tage) und verknüpft jeden Testlauf mit dem auslösenden Commit bzw. Pull Request, sodass Testergebnisse direkt der jeweiligen Quellcode-Version zugeordnet werden können `(bereits implementiert)`. Für einen reiferen Prozess sollten Testläufe zusätzlich mit standardisierten Run-Logs, Artefakt-Uploads und Teststatusübersichten dokumentiert werden, z. B. in GitHub Actions und YouTrack `(teilweise bereits implementiert)`.

<a id="63-defect-reports"></a>
## 6.3 Defect Reports

Ein formales Defect-Management-Artefakt noch nicht vorhanden. Empfohlen wird die Erfassung von Testvorfällen mit Reproduktionsschritten, betroffener Komponente, Schweregrad, Build-/Commit-Bezug und Status in YouTrack oder GitHub Issues/PRs `(noch nicht implementiert)`. 

<a id="7-appendix-a-project-tasks"></a>
# 7. Appendix A: Project Tasks

Nachfolgend sind die testbezogenen Aufgaben aufgeführt:

- Testplanung
      - Ermittlung der Testanforderungen
      - Risikobewertung
      - Entwicklung einer Teststrategie
      - Ermittlung der Testressourcen
      - Erstellung eines Zeitplans
      - Erstellung eines Testplans

- Testentwurf
      - Erstellung einer Arbeitslastanalyse
      - Ermittlung und Beschreibung von Testfällen
      - Ermittlung und Strukturierung von Testabläufen
      - Überprüfung und Bewertung der Testabdeckung

- Testdurchführung
      - Aufzeichnen oder Programmieren von Testskripten
      - Identifizieren testspezifischer Funktionen im Entwurfs- und Implementierungsmodell
      - Einrichten externer Datensätze

- Testausführung
      -  Ausführen von Testverfahren
      - Auswerten der Testausführung
      - Wiederherstellen nach einem abgebrochenen Test
      - Überprüfen der Ergebnisse
      - Untersuchen unerwarteter Ergebnisse
      - Protokollieren von Fehlern

- Test auswerten
      - Testfallabdeckung bewerten
      - Codeabdeckung bewerten
      - Fehler analysieren
      - feststellen, ob die Testabschlusskriterien und Erfolgskriterien erfüllt wurden