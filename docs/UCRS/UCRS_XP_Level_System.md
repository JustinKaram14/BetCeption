## Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 02.12.2025 | 1.0 | UCRS für XP- und Level-System (aktueller Stand: read-only) erstellt | Team BetCeption |

# BetCeption  
## Use-Case-Realization Specification: XP- und Level-System verwalten  
Version 1.0  

---

## 1. Introduction
Diese UCRS beschreibt die technische Realisierung des Use Cases **XP- und Level-System verwalten** (UC9). Aktuell sind XP/Level nur lesbar; Berechnung und Aufstieg sind noch nicht implementiert.

### 1.1 Purpose
XP/Level konsistent bereitstellen, zukünftige Aufstiegslogik vorbereiten und aktuelle Lesewege dokumentieren.

### 1.2 Scope
- Lesender Zugriff auf XP/Level über Wallet- und Leaderboard-Endpunkte.  
- Noch keine serverseitige XP-Berechnung oder Level-Aufstiege.  
- Power-Up-Käufe prüfen `level >= minLevel`.

### 1.3 Definitions, Acronyms, and Abbreviations
- **XP:** Erfahrungspunkte (int).  
- **Level:** Ganzzahliger Fortschrittswert, aktuell statisch.  
- **Leaderboard Level:** View mit Level/Xp pro User.

### 1.4 References
- UC9_XP_Level-System_verwalten.md  
- db/schema.sql (users.xp/level, leaderboard_level_view)  
- Backend-Routen `wallet`, `leaderboard/level`

### 1.5 Overview
Kapitel 2 fasst den Implementierungsstand, Kapitel 3 den aktuellen Flow, Kapitel 4 das Sequenzdiagramm, Kapitel 5 die abgeleiteten Anforderungen.

---

## 2. Implementierungsstand (aktueller Code)
- **Backend:** Felder `xp` und `level` existieren auf `users`. Es gibt keine Pfade, die XP/Level erhöhen; APIs geben Werte nur aus (`GET /wallet`, `GET /leaderboard/level`). Power-Up-Kauf prüft Level-Mindestanforderung.  
- **Frontend:** Zeigt XP/Level in Wallet-Summary und im Level-Tab des Leaderboards. Keine Fortschritts- oder Level-Up-UI, keine Logik für Aufstieg.  
- **Abweichungen:** Im UC beschriebene XP-Berechnung, Level-Grenzen, Freischaltungen und Benachrichtigungen fehlen.

---

## 3. Flow of Events - Design (aktuell read-only)

### 3.1 XP/Level abrufen
1. Spieler ist eingeloggt.  
2. Frontend ruft `GET /wallet` auf und erhält `balance, xp, level, lastDailyRewardAt`.  
3. Frontend ruft `GET /leaderboard/level?limit=10` auf, um Level-Ranking zu laden (optional `currentUserRank` bei Token).  
4. UI zeigt XP/Level und Rangliste an. Keine Updates an XP/Level erfolgen.

---

## 4. Sequenzdiagramm
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as Wallet/Leaderboard API
  participant DB as DB

  FE->>API: GET /wallet (Bearer)
  API->>DB: Read user {balance,xp,level,lastDailyRewardAt}
  API-->>FE: 200 {balance,xp,level,lastDailyRewardAt}

  FE->>API: GET /leaderboard/level?limit=10
  API->>DB: Query leaderboard_level_view ORDER BY level DESC, xp DESC
  API-->>FE: 200 {items, currentUserRank?}

  Note over FE,API: XP/Level werden aktuell nicht erhöht; read-only
```

---

## 5. Derived Requirements
- XP/Level müssen konsistent aus DB geliefert werden; keine Mutationen in aktuellen Flows.  
- Level-Prüfung bei Power-Up-Kauf beibehalten (`level >= minLevel`).  
- Antwortzeit < 1 s für Wallet/Leaderboard-Reads.  
- Optionaler Ausbau: XP-Formel, Level-Grenzen-Konfiguration, Aufstiegs-Events, Benachrichtigung, Audit-Log.

---

## 2. Overall Description
- **Product Perspective:** Querschnittsfunktion; aktuell read-only Anzeige aus `users`/View.  
- **Product Functions:** XP/Level ausliefern, Level-Leaderboard anzeigen; Level-Gate bei Power-Up-Kauf.  
- **User Characteristics:** Eingeloggt; sieht XP/Level im Wallet/Leaderboard.  
- **Constraints:** Keine Mutationen; nur GET; Auth nötig für Wallet, optional für Rank.  
- **Assumptions/Dependencies:** UC2 (Wallet), UC4 (Leaderboard), UC8 (Level-Gate), UC1 (Auth).  
- **Requirements Subset:** Kein Level-Up/XP-Berechnung implementiert.

## 3. Specific Requirements
### 3.1 Functionality
- FR1: `GET /wallet` muss `xp` und `level` zurückliefern.  
- FR2: `GET /leaderboard/level` muss Level-Ranking liefern, optional `currentUserRank`.  
- FR3: Power-Up-Kauf muss `level >= minLevel` prüfen.  
- FR4: Keine Endpunkte dürfen XP/Level verändern.

### 3.2 Usability
- U1: Felder klar benannt (`xp`, `level`).  
- U2: Leere Ranglisten handhabbar (items []).

### 3.3 Reliability
- R1: XP/Level werden nicht verändert; Lesungen konsistent aus DB/View.  
- R2: Level-View sortiert deterministisch (level DESC, xp DESC).

### 3.4 Performance
- P1: Antwortzeit < 1 s für Wallet/Leaderboard.  
- P2: Views/Indizes für Level-Queries.

### 3.5 Supportability
- S1: Logging von `userId`/Rank-Requests.  
- S2: Vorbereitung für spätere XP-Formel/Levelgrenzen konfigurierbar.

### 3.6 Design Constraints
- DC1: JWT/HTTPS für Wallet; Leaderboard öffentlich für Items.  
- DC2: Keine Mutationspfade.

### 3.7 Online User Documentation and Help System Requirements
- H1: API-Doku `/wallet`, `/leaderboard/level`.

### 3.8 Purchased Components
- PC1: Keine.

### 3.9 Interfaces
- **User Interfaces:** Wallet/Leaderboard-UI.  
- **Hardware Interfaces:** Keine.  
- **Software Interfaces:** REST-APIs, DB `users`, View `leaderboard_level_view`.  
- **Communications Interfaces:** HTTPS, JSON; optional JWT.

### 3.10 Licensing Requirements
- Keine.

### 3.11 Legal, Copyright, and Other Notices
- Datenschutz: nur eigene Wallet-Daten; Leaderboard anonymisiert falls nötig.

### 3.12 Applicable Standards
- HTTPS, JWT, SQL Views.

## 4. Supporting Information
- Sequenzdiagramm Abschnitt 4.  
- Flows Abschnitt 3.1.


