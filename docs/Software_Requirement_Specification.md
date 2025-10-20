# BetCeption:  Software Requirements Specification (SRS)

## Table of contents
- [Einführung](#1-einführung)
  - [Zweck](#11-zweck)
  - [Geltungsbereich](#12-geltungsbereich)
  - [Definition, Akronyme und Abkürzungen](#13-definition-akronyme-und-abkürzungen)
  - [Referenzen](#14-referenzen)
  - [Überblick](#15-überblcik)
- [Gesamtbeschreibung](#2-overall-description)
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

## Einleitung
### Zweck
Dieses Software Requirements Specification (SRS) beschreibt die funktionalen und nicht-funktionalen Anforderungen an **BetCeption**, eine Webanwendung, die ein virtuelles Casino-Erlebnis mit Fokus auf **Blackjack** und **Sidebets** (Zusatzwetten auf Ereignisse innerhalb einer Runde) bietet.  
Das Dokument richtet sich an das Entwicklungsteam, den Product Owner sowie den Prüfer des Moduls und dient als gemeinsame Grundlage für Scope, Verhalten, Randbedingungen, Schnittstellen und Qualitätsziele.

### Umfang 
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


### Überblick
Das folgende Kapitel gibt einen Überblick über das Projekt mit Vision, Produktperspektive und Funktionsrahmen. Außerdem zeigt es ein Use-Case-Diagramm, das die Anwendung als Ganzes abbildet. Das danach folgende Kapitel beschreibt die Anforderungen im Detail auf Basis von Use Cases, inklusive kurzer Beschreibungen, GUI-Mockups, Sequenzdiagrammen sowie Vor- und Nachbedingungen. Nicht-funktionale Aspekte wie Bedienbarkeit, Zuverlässigkeit, Leistung und Wartbarkeit werden dort ebenfalls konkretisiert. Abschließend enthält das Dokument einen Abschnitt mit unterstützenden Informationen.

### 2.1 Vision
BetCeption bietet ein schnelles und zugängliches Blackjack-Erlebnis im Browser. Spieler setzen mit virtuellem Guthaben und können pro Runde Sidebets platzieren, um zusätzliche Spannung zu erzeugen. Optional aktivierbare Power-Ups („Pillen“) geben zeitlich begrenzte Vorteile und schaffen kurze, taktische Entscheidungen. Das System wertet jede Runde serverseitig nach festen Regeln aus und stellt damit ein faires, nachvollziehbares Spiel sicher. Der Fokus des MVP liegt auf einer stabilen Kernmechanik, einer klaren Benutzerführung und einer reibungslosen Interaktion zwischen Frontend und Backend. Erweiterungen wie History/Verlauf und Leaderboard bleiben bewusst außerhalb des MVP und können zu einem späteren Zeitpunkt ergänzt werden.
