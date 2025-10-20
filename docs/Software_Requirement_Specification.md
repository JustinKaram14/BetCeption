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
    - [Supportability](#35-sipportability)
    - [Designbeschränkugnen](#36-designbeschränkugnen)
    - [Anforderungen an die Online-Benutzerdokumentation und das Hilfesystem](#37-anforderungen-an-die-online-benutzerdokumentation-und-das-hilfesystem)
    - [Purchased Compponents](#38-purchased-components)
    - [Schnittstellen](#39-schnittstellen)
    - [Lizenzanforderungen](#310-lizenzanforderungen)
    - [Rechtliche Hinweise, Urheberrecht und sonstige Hinweise](#311-rechtliche-hinweise-urheberrecht-und-andere-hinweise)
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

## 3. Spezifische Anforderungen
Dieser Abschnitt beschreibt die Anwendungsfälle aus dem Use-Case-Diagramm und skizziert ihre Aufgabe im System. Die detaillierten Spezifikationen (Flows, Mockups, Sequenzen, Vor-/Nachbedingungen und Story Points) sind in den verlinkten UC-Dokumenten hinterlegt.

#### Umsetzung im MVP
**3.1.1 Registrieren**  
Nutzer legen ein Konto an und erhalten nach erfolgreicher Anlage Zugriff auf das Spiel.  
[Zur Spezifikation](./UC1_Regestrieren.md)

**3.1.2 Anmelden**  
Bereits registrierte Nutzer melden sich an und erhalten ein JWT zur Autorisierung weiterer Aufrufe.  
[Zur Spezifikation](./UC2_Login.md)

**3.1.3 Spiel starten**  
Der Spieler setzt seinen Haupteinsatz und startet eine neue Blackjack-Runde. Der Dealer gibt aus und die Runde beginnt.  
[Zur Spezifikation](./UC5_Spiel_starten.md)

**3.1.4 Wette platzieren (Haupteinsatz)**  
Der Spieler legt die Höhe seines Haupteinsatzes fest. Das System prüft das verfügbare Guthaben und reserviert den Betrag.  
[Zur Spezifikation](./UC6_Wette_platzieren.md)

**3.1.5 Nebenwette platzieren (Sidebet)**  
Zusätzlich zum Haupteinsatz kann der Spieler eine Sidebet auswählen und setzen (z. B. „Dealer gewinnt“). Die Bewertung erfolgt am Rundenende.  
[Zur Spezifikation](./UC7_Nebenwette_platzieren.md)

**3.1.6 Power-Ups kaufen**  
Spieler erwerben „Pillen“ mit virtuellem Guthaben und legen sie in ihr Inventar.  
[Zur Spezifikation](./UC9_PowerUps_Kaufen.md)

**3.1.7 Power-Up einsetzen**  
Ein gekauftes Power-Up wird aktiviert und ist für eine definierte Anzahl an Runden wirksam. Pro Runde entscheidet ein Trigger, ob der Vorteil greift.  
[Zur Spezifikation](./UC10_PowerUp_Einsetzen.md)

**3.1.8 Guthaben anzeigen & verwalten**  
Das System zeigt das verfügbare virtuelle Guthaben an und verbucht Einsätze sowie Auszahlungen. Optional sind simulierte Einzahlungen möglich.  
[Zur Spezifikation](./UC13_Guthaben_anzeigen_verwalten.md)

**3.1.9 Abmelden**  
Der Spieler beendet seine Sitzung und das Token verliert seine Gültigkeit auf Client-Seite.  
[Zur Spezifikation](./UC14_Abmelden.md)

#### Ergänzende Systemfunktionen im MVP (technisch)
**3.1.10 Daten persistieren**  
Spiel- und Nutzungsdaten werden in der Datenbank gespeichert, damit Runden korrekt ausgewertet und Salden konsistent geführt werden.  
[Zur Spezifikation](./UC15_Daten_persistieren.md)

**3.1.11 Authentifizierung prüfen**  
Geschützte Endpunkte prüfen das JWT und lassen nur autorisierte Zugriffe zu.  
[Zur Spezifikation](./UC16_Authetifizierung_pruefen.md)

#### Zeitlich offen (außerhalb des MVP)
**3.1.12 Daily-Reward**  
Spieler erhalten bei täglichem Login einen Bonus, der zur Progression motiviert.  
[Zur Spezifikation](./UC3_Daily_Reward.md)

**3.1.13 Leaderboard anzeigen**  
Das System stellt eine Rangliste mehrerer Spieler dar. Die endgültigen Kriterien (z. B. Gewinnsumme, Siegquote, längste Serie) werden später festgelegt.  
[Zur Spezifikation](./UC4_Leaderboard_anzeigen.md)

**3.1.14 Spielzug ausführen**  
Interaktionen innerhalb der Runde (z. B. Hit/Stand) werden als Spielzug modelliert und an die Engine übergeben.  
[Zur Spezifikation](./UC8_Spielzeug_ausfuehren.md)

**3.1.15 Inventar anzeigen**  
Spieler sehen ihre gekauften Power-Ups und deren verbleibende Runden.  
[Zur Spezifikation](./UC12_Inventar_anzeigen.md)

**3.1.16 XP-/Level-System verwalten**  
Fortschritt durch gespielte Runden führt zu Erfahrungspunkten und Level-Aufstiegen, die neue Boni freischalten können.  
[Zur Spezifikation](./UC11_XP_Level-System_verwalten.md)

