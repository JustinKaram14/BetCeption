## Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 27.10.2025 | 0.1 | Initiale SRS (Neue Ordnerstruktur) | Team BetCeption|

# BetCeption:  Software Requirements Specification (SRS)

## Table of contents
- [Einleitung](#1-einleitung)
  - [Zweck](#11-zweck)
  - [Umfang](#12-umfang)
  - [Definitionen, Akronyme und Abkürzungen](#13-definitionen-akronyme-und-abkürzungen)
  - [Referenzen](#14-referenzen)
  - [Überblick](#15-überblick)
- [Gesamtbeschreibung](#2-gesamtbeschreibung)
  - [Vision](#21-vision)
  - [Use Case Diagram](#22-use-case-diagram)
  - [Technologie-Stack](#23-technologie-stack)
- [Spezifische Anforderungen](#3-spezifische-anforderungen)
    - [Funktionalität](#31-funktionalität)
    - [Benutzerfreundlichkeit](#32-benutzerfreundlichkeit)
    - [Zuverlässigkeit](#33-zuverlässigkeit)
    - [Leistung](#34-leistung)
    - [Supportability](#35-supportability)
    - [Designbeschränkugnen](#36-designbeschränkungen)
    - [Anforderungen an die Online-Benutzerdokumentation und das Hilfesystem](#37-anforderungen-an-die-online-benutzerdokumentation-und-das-hilfesystem)
    - [Purchased Components](#38-purchased-components)
    - [Schnittstellen](#39-schnittstellen)
    - [Lizenzanforderungen](#310-lizenzanforderungen)
    - [Rechtliche Hinweise, Urheberrecht und sonstige Hinweise](#311-rechtliche-hinweise-urheberrecht-und-sonstige-hinweise)
    - [Anwendbare Standards](#312-anwendbare-standards)
- [Begleitende Informationen](#4-begleitende-informationen)

## 1. Einleitung
### 1.1 Zweck
Dieses Software Requirements Specification (SRS) beschreibt die funktionalen und nicht-funktionalen Anforderungen an **BetCeption**, eine Webanwendung, die ein virtuelles Casino-Erlebnis mit Fokus auf **Blackjack** und **Sidebets** (Zusatzwetten auf Ereignisse innerhalb einer Runde) bietet.  
Das Dokument richtet sich an das Entwicklungsteam, den Product Owner sowie den Prüfer des Moduls und dient als gemeinsame Grundlage für Scope, Verhalten, Randbedingungen, Schnittstellen und Qualitätsziele.

### 1.2 Umfang 
Dieses SRS beschreibt **BetCeption**, eine browserbasierte Anwendung zum Spielen von **Blackjack** mit **Sidebets** (Zusatzwetten) und **virtuellem Guthaben** (kein Echtgeld). Der dokumentierte Umfang bezieht sich auf das **MVP** und ist mit dem **Use-Case-Modell** der Anwendung verknüpft (u. a. *Registrieren*, *Anmelden*, *Runde starten*, *Hit*, *Stand*, *Sidebet platzieren*, *Power-Up aktivieren*). Erweiterungen außerhalb des MVP werden am Ende dieses Abschnitts benannt.

#### Geplante Subsysteme (MVP)
**Authentifizierung (JWT):**  
Nutzer können sich registrieren und anmelden. Nach erfolgreichem Login erhält der Client ein JSON Web Token (JWT) und nutzt es für autorisierte API-Aufrufe.

**Wallet (virtuelles Guthaben):**  
Das System verwaltet virtuelles Guthaben ohne Echtgeldbezug. Einsätze werden vor Rundenstart geprüft und gebucht. Auszahlungen werden nach Rundenende verrechnet.

**Blackjack-Engine:**  
Serverseitige Karten- und Auswertelogik für Deal, Hit und Stand. Der Dealer spielt regelbasiert bis mindestens 17, dabei gilt **S17** (Dealer steht bei Soft-17).

**Sidebets:**  
Pro Runde können zusätzlich zur Hauptwette Sidebets platziert werden, zum Beispiel „Dealer gewinnt“. Die Engine bewertet Sidebets am Rundenende und verbucht die zugehörigen Auszahlungen.

**Power-Ups („Pillen“):**  
Spieler können optionale, zeitlich begrenzte Boni aktivieren, zum Beispiel **Red Pill** mit Chance auf eine x3-Auszahlung bei Gewinnen oder **Blue Pill** mit Chance auf eine „Safe-Round“ ohne Verlust. Es ist immer nur ein Power-Up gleichzeitig aktiv. Der Bonus gilt für eine definierte Anzahl von Runden.

#### Außerhalb des MVP (zeitlich offen)
**History/Verlauf:**  
Übersicht über vergangene Runden mit Zeitpunkt, Einsatz, Ergebnis, Auszahlungen sowie Sidebet-Zusammenfassung (optionale Detailansicht).

**Leaderboard (Rangliste):**  
Die Rangliste bildet die Leistung mehrerer Spieler ab. Welche Kriterien dafür gelten, legen wir später fest. In Frage kommen zum Beispiel die gesamte Gewinnsumme, die Siegquote oder die längste Gewinnserie. Die finale Auswahl der Kriterien treffen wir zu einem späteren Zeitpunkt.

**Weitere Spiele und Administration:**  
Zusätzliche Casinospiele neben Blackjack sowie Administrationsfunktionen (Moderation/Benutzerverwaltung) sind nicht Teil des MVP.

### 1.3 Definitionen, Akronyme und Abkürzungen

| Begriff / Abkürzung | Bedeutung |
| --- | --- |
| SRS | Software Requirements Specification. Dieses Dokument mit den Anforderungen an BetCeption. |
| Use Case (UC) | Anwendungsfall mit klarer Zielsetzung aus Sicht eines Akteurs. |
| MVP | Minimum Viable Product. Minimaler, nutzbarer Funktionsumfang, der im Projekt verbindlich geliefert wird. |
| JWT | JSON Web Token. Signiertes Token für die Anmeldung und Autorisierung von API-Aufrufen (Bearer-Token). |
| Wallet | Virtuelles Guthaben der Spieler. Kein Echtgeld. Einsätze und Auszahlungen werden dort verbucht. |
| Sidebet | Zusatzwette auf ein Ereignis innerhalb einer Blackjack-Runde, zum Beispiel „Dealer gewinnt“. |
| Power-Up („Pille“) | Zeitlich begrenzter Vorteil, der vor einer Runde aktiviert wird, zum Beispiel *Red Pill* (Chance auf x3-Auszahlung) oder *Blue Pill* (Chance auf „Safe-Round“ ohne Verlust). |
| Dealer | Bank im Blackjack. Spielt nach festen Regeln und nicht frei wie der Spieler. |
| Soft-17 (S17) | Dealer-Regel: Handwert 17 mit Ass als 11. Bei **S17** steht der Dealer bei Soft-17. |
| Push | Unentschieden zwischen Spieler und Dealer. Einsatz wird zurückgegeben. |
| Bust | Überkaufen. Handwert über 21. Die Runde ist verloren (für die jeweilige Partei). |
| Blackjack (Natural) | Start mit Ass und einer Zehn-Wert-Karte (10/J/Q/K). Zählt als 21 bei der ersten Ausgabe. |
| RNG | Random Number Generator. Zufallsquelle zur Kartenmischung. |
| SPA | Single-Page Application. Frontend-Architektur, die clientseitig navigiert. |


### 1.4 Referenzen

| Titel | Datum | Herausgeber | Bezugsquelle |
| --- | --- | --- | --- |


### 1.5 Überblick
Das folgende Kapitel gibt einen Überblick über das Projekt mit Vision, Produktperspektive und Funktionsrahmen. Außerdem zeigt es ein Use-Case-Diagramm, das die Anwendung als Ganzes abbildet. Das danach folgende Kapitel beschreibt die Anforderungen im Detail auf Basis von Use Cases, inklusive kurzer Beschreibungen, GUI-Mockups, Sequenzdiagrammen sowie Vor- und Nachbedingungen. Nicht-funktionale Aspekte wie Bedienbarkeit, Zuverlässigkeit, Leistung und Wartbarkeit werden dort ebenfalls konkretisiert. Abschließend enthält das Dokument einen Abschnitt mit unterstützenden Informationen.

## 2. Gesamtbeschreibung
### 2.1 Vision
BetCeption bietet ein schnelles und zugängliches Blackjack-Erlebnis im Browser. Spieler setzen mit virtuellem Guthaben und können pro Runde Sidebets platzieren, um zusätzliche Spannung zu erzeugen. Optional aktivierbare Power-Ups („Pillen“) geben zeitlich begrenzte Vorteile und schaffen kurze, taktische Entscheidungen. Das System wertet jede Runde serverseitig nach festen Regeln aus und stellt damit ein faires, nachvollziehbares Spiel sicher. Der Fokus des MVP liegt auf einer stabilen Kernmechanik, einer klaren Benutzerführung und einer reibungslosen Interaktion zwischen Frontend und Backend. Erweiterungen wie History/Verlauf und Leaderboard bleiben bewusst außerhalb des MVP und können zu einem späteren Zeitpunkt ergänzt werden.

### 2.2 Use Case Diagram
<img width="1682" height="1911" alt="unnamed__usssss" src="https://github.com/user-attachments/assets/e8e5eded-eec0-4e66-9a2c-068eeb8ba0d8" />

### 2.3 Technologie-Stack
Die Anwendung wird mit folgenden Technologien umgesetzt:

**Backend:**  
- Node.js mit Express  
- REST-API mit JSON  
- Authentifizierung über JWT, Passwörter mit bcrypt

**Datenbank:**  
- MySQL 8 (laufend in Docker)  
- DB-Schema und Migrationen projektintern verwaltet

**Frontend:**  
- Angular mit TypeScript und RxJS  
- Styling mit CSS

**IDE / Tools:**  
- Visual Studio Code (Haupteditor)  
- MySQL Workbench für Datenbank-Inspektion

**Projektmanagement & Versionsverwaltung:**  
- YouTrack für Backlog, Sprints und Zeiterfassung  
- GitHub für Quellcode und Reviews


**Containerisierung & Laufzeit:**  
- Docker und Docker Compose für lokale Entwicklungsumgebung

**CI/CD:**  
- GitHub Actions für Linting, Tests und Build

#### Umsetzung im MVP

**3.1.1 Authentifizierung & Session-Management**  
Registrieren, Anmelden und Abmelden. Nach erfolgreichem Login erhält der Nutzer ein JWT; geschützte Endpunkte prüfen dieses Token.  
[Zur Spezifikation](./UC1_Authentifizierung_&_Session_Management.md)

**3.1.2 Spiel starten**  
Der Spieler setzt seinen Haupteinsatz und startet eine neue Blackjack-Runde. Der Dealer gibt aus und die Runde beginnt.  
[Zur Spezifikation](./UC5_Spiel_starten.md)

**3.1.3 Wetten platzieren (Haupteinsatz & Sidebet)**  
Der Spieler legt die Höhe seines Haupteinsatzes fest und kann optional Sidebets setzen (z. B. „Dealer gewinnt“). Guthaben wird geprüft und reserviert; Auswertung am Rundenende.  
[Zur Spezifikation](./UC6_Wetten_platzieren.md)

**3.1.4 Shop, Inventar & Guthaben verwalten**  
Spieler kaufen „Pillen“ (Power-Ups) mit virtuellem Guthaben, sehen ihr Inventar und ihr verfügbares Guthaben; Buchungen (Einsatz/Auszahlung) werden geführt.  
[Zur Spezifikation](./UC2_Shop_Inventag_Guthabeverwaltung.md)

**3.1.5 Power-Up einsetzen**  
Ein gekauftes Power-Up wird aktiviert und wirkt für eine definierte Anzahl an Runden; pro Runde entscheidet ein Trigger, ob der Vorteil greift.  
[Zur Spezifikation](./UC8_PowerUp_Einsetzen.md)

**3.1.6 Daten persistieren**  
Spiel- und Nutzungsdaten werden in der Datenbank gespeichert, damit Runden korrekt ausgewertet und Salden konsistent geführt werden.  
[Zur Spezifikation](./UC10_Daten_persistieren.md)

---

#### Zeitlich offen (außerhalb des MVP)

**3.1.7 Daily-Reward**  
Spieler erhalten bei täglichem Login einen Bonus zur Progression.  
[Zur Spezifikation](./UC3_Daily_Reward.md)

**3.1.8 Leaderboard anzeigen**  
Das System stellt eine Rangliste mehrerer Spieler dar (Kriterien wie Gewinnsumme, Siegquote, Serien).  
[Zur Spezifikation](./UC4_Leaderboard_anzeigen.md)

**3.1.9 Spielzug ausführen**  
Interaktionen innerhalb der Runde (z. B. Hit/Stand) werden als Spielzug modelliert und an die Engine übergeben.  
[Zur Spezifikation](./UC7_Spielzeug_ausfuehren.md)

**3.1.10 XP-/Level-System verwalten**  
Fortschritt durch gespielte Runden führt zu Erfahrungspunkten und Level-Aufstiegen, die neue Boni freischalten können.  
[Zur Spezifikation](./UC9_XP_Level-System_verwalten.md)

### 3.2 Benutzerfreundlichkeit
ie Oberfläche soll ohne Anleitung verständlich sein. Zentrale Aktionen sind jederzeit sichtbar und mit klaren Bezeichnungen versehen. Interaktionen folgen einem einfachen, wiederkehrenden Muster: Einsatz wählen, Runde starten, Entscheidung treffen, Ergebnis sehen. Tooltips und kurze Inline-Hinweise helfen bei Bedarf, ohne den Spielfluss zu stören.

#### 3.2.1 Keine Einarbeitungszeit
Spieler sollen das Spiel im Browser öffnen und alle Grundfunktionen ohne zusätzliche Erklärungen nutzen können. Die wichtigsten Aktionen sind maximal zwei Klicks entfernt.

#### 3.2.2 Vertraute Muster
UI-Komponenten orientieren sich an gängigen Web- und Casino-Mustern. Buttons, Chips und Modale verhalten sich konsistent. Tastatur-Shortcuts für Hit und Stand können optional aktiviert werden.

#### 3.2.3 Barrierefreiheit (Basis)
Kontraste erfüllen WCAG-Basiswerte. Fokus-Reihenfolge ist nachvollziehbar. Alle interaktiven Elemente sind mit der Tastatur erreichbar. Animationen sind dezent und beeinträchtigen die Lesbarkeit nicht.

#### 3.2.4 Responsives Verhalten
Layout und Bedienelemente passen sich an gängige Auflösungen an. Auf kleineren Displays werden sekundäre Informationen ausgeblendet oder komprimiert, ohne Funktionen zu verlieren.


### 3.3 Zuverlässigkeit
Das System priorisiert eine stabile Spiellogik und konsistente Buchungen. Ausfälle sollen den Spielfortschritt nicht verfälschen. Einsätze und Auszahlungen werden zuverlässig erfasst und nachverfolgbar gespeichert.

#### 3.3.1 Verfügbarkeit
Die Anwendung ist im Projektkontext zu mindestens **95 %** verfügbar. Geplante Wartungen werden außerhalb typischer Nutzungszeiten durchgeführt. Kurzzeitige Unterbrechungen führen nicht zum Verlust von bereits verbuchten Einsätzen.

#### 3.3.2 Datenkonsistenz
Buchungen erfolgen atomar. Ein Start einer Runde reserviert den Einsatz, die Auswertung verbucht Gewinn oder Verlust. Doppelte Anfragen werden erkannt und nicht doppelt gebucht. Wallet-Salden bleiben konsistent.

#### 3.3.3 Fehlertoleranz und Wiederaufnahme
Bei Verbindungsproblemen wird die letzte Spielaktion serverseitig sicher abgeschlossen. Nach einem Reload kann der Spieler den Status der aktuellen oder letzten Runde einsehen. Fehler werden geloggt und mit einer neutralen Fehlermeldung angezeigt, ohne vertrauliche Details offenzulegen.

#### 3.3.4 Datensicherung (Projektumfang)
Persistente Daten werden regelmäßig gesichert. Bei einem Ausfall können Nutzerkonten und Wallet-Stände wiederhergestellt werden.

### 3.4 Leistung
Die Anwendung reagiert zügig und bleibt unter Last bedienbar. Angaben beziehen sich auf das MVP.

#### 3.4.1 Kapazität
Das System verarbeitet dauerhaft viele parallele Anfragen. Ziel sind mindestens 100 gleichzeitige aktive Sitzungen im Testbetrieb. Registrierungen und Logins sind nicht limitiert.

#### 3.4.2 Speicherbedarf
Das Frontend bleibt schlank. Startbundle möglichst unter 300 kB gzip. Bilder und Assets werden nachgeladen. Serverseitig werden nur notwendige Daten gespeichert.

#### 3.4.3 Antwortzeiten
API-Aufrufe für Spielaktionen liegen im 95-Perzentil unter 300 ms. Anmelden und Registrieren unter 600 ms. Die erste nutzbare Ansicht wird im Browser innerhalb von 2 Sekunden geladen.

#### 3.4.4 Datenbankzugriffe
Pro Spielaktion maximal zwei schreibende Transaktionen. Häufige Abfragen sind indiziert und antworten im 95-Perzentil unter 50 ms.

#### 3.4.5 Stabilität bei Verbindungsproblemen
Kurzzeitige Ausfälle führen nicht zu doppelten Buchungen. Idempotente Requests werden bei Bedarf automatisch wiederholt. Der Spielstatus lässt sich nach einem Reload herstellen.


### 3.5 Supportability
Der Code ist gut wartbar, testbar und nachvollziehbar. Konfiguration und Infrastruktur sind für das Team leicht zu bedienen.

#### 3.5.1 Coding-Standards
Einheitlicher Stil mit ESLint und Prettier. Aussagekräftige Namen und kleine, gut testbare Funktionen. Trennung von API-Schicht, Geschäftslogik und Datenzugriff. Keine geheimen Werte im Code. Konfiguration über Umgebungsvariablen.

#### 3.5.2 Teststrategie
Unit-Tests für Blackjack-Logik, Sidebets und Power-Ups. API-Tests für Endpunkte mit Jest und Supertest. Frontend-Unit-Tests mit Jasmine oder Jest. Optional E2E-Tests mit Cypress für den Happy Path. Ziel ist eine hohe Abdeckung der Kernlogik.

#### 3.5.3 Logging und Monitoring
Server protokolliert Fehler und wichtige Ereignisse strukturiert. Logs enthalten keine sensiblen Daten. Fehler werden dem Nutzer neutral angezeigt. Im Team stehen einfache Auswertungen der Logs bereit.

#### 3.5.4 Build, CI und Container
Projekt lässt sich mit einem Befehl starten. Docker Compose stellt Backend und Datenbank bereit. GitHub Actions führt Linting, Tests und Build aus. Artefakte sind reproduzierbar.

#### 3.5.5 Dokumentation
Kurzbeschreibungen zu Setup, Start und häufigen Aufgaben liegen im Repository. API-Routen sind beschrieben. Wichtige Architekturentscheidungen werden knapp festgehalten.

#### 3.5.6 Internationalisierung (Basis)
Texte sind zentral abgelegt. Eine spätere Übersetzung ist möglich, auch wenn das MVP zunächst deutsch bleibt.

### 3.6 DesignbeschrAnkungen
- Frontend: Angular/TypeScript SPA, REST-only (kein WebSocket im MVP).
- Backend: Node/Express mit TypeORM auf MySQL 8; Decimal fuer Geldbetraege, int fuer XP/Level.
- Auth: JWT + HttpOnly Refresh-Cookie; HTTPS Pflicht.
- Keine Echtgeldeinzahlungen, kein Dritt-Payment; virtuelle Coins nur im System.

### 3.7 Anforderungen an die Online-Benutzerdokumentation und das Hilfesystem
- Kurze In-App-Hinweise zu Einsatz, Hit/Stand, Sidebets.
- FAQ/Onboarding als statische Seite verlinkbar.
- API-Doku (Swagger o.ä.) fuer Auth, Round, Bets, Wallet, Powerups, Leaderboard, Rewards.

### 3.8 Purchased Components
- Keine lizenzierten Drittkomponenten ausser ueblicher OSS (Node, Angular, MySQL).
- Keine externen Payment- oder RNG-Dienste.

### 3.9 Schnittstellen
- User Interfaces: Browser-UI (Angular), responsive; optionale Tastaturkuerzel fuer Hit/Stand.
- Hardware Interfaces: keine speziellen Anforderungen.
- Software Interfaces: REST/JSON Endpunkte (Auth, Round, Bets, Wallet, Shop/Inventory, Powerups, Rewards, Leaderboard); DB MySQL 8 per TypeORM.
- Communications Interfaces: HTTPS, Bearer-JWT, HttpOnly Refresh-Cookie.

### 3.10 Lizenzanforderungen
- Interne Nutzung; OSS-Lizenzen der Abhaengigkeiten beachten (MIT/Apache u.a.).
- Keine proprietaeren Runtime-Lizenzen noetig.

### 3.11 Rechtliche Hinweise, Urheberrecht und sonstige Hinweise
- Keine Echtgeld-Transaktionen; nur virtuelles Guthaben.
- Datenschutz: nur noetige personenbezogene Daten (E-Mail, Username, Hash) speichern; keine Passwoerter im Klartext, keine sensiblen Daten in Logs.
- Branding/Assets: interne Nutzung; fremde Marken nicht verwenden.

### 3.12 Anwendbare Standards
- OWASP ASVS (Auth, Session, Input-Validation) als Leitlinie.
- JWT Best Practices (Signatur, Ablauf, Rotation).
- ACID-Transaktionen fuer Geld- und Spielbuchungen.
- Accessibility: WCAG-Basis (Kontrast, Fokus).

## 4. Begleitende Informationen
- Vollstaendige Use-Case-Spezifikationen: `docs/UseCases/UC1..UC10*.md`.
- Use-Case-Realization (UCRS) mit Sequenz- und Aktivitaetsdiagrammen: `docs/UCRS/*.md`.
- Architektur- und Qualitaetsartefakte: `docs/architecture/*.md`, Utility-Tree und Klassendiagramm.
- Glossar/Definitionen siehe Abschnitt 1.3 und UCRS-Referenzen.



