## Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 02.12.2025 | 1.0 | UCRS für Wetten platzieren (Haupt- und Nebenwetten) erstellt | Team BetCeption |

# BetCeption  
## Use-Case-Realization Specification: Wetten platzieren (Haupt- und Nebenwetten)  
Version 1.0  

---

## 1. Introduction
Diese UCRS beschreibt die technische Realisierung des Use Cases **Wetten platzieren** (UC6) für Haupt- und Nebenwetten im Blackjack-Spiel. Sie dokumentiert, wie Frontend, Backend und Datenbank Einsätze validieren, Guthaben belasten und Bets persistieren.

### 1.1 Purpose
Einsätze sicher und atomar buchen, Haupt- und optionale Nebenwetten erfassen und den Spielstart bzw. die spätere Auswertung vorbereiten.

### 1.2 Scope
- **Hauptwette (Main Bet):** Wird beim Rundenstart gesetzt.  
- **Nebenwetten (Side Bets):** Optional zum Rundenstart (aktuell kein In-Game-Fenster implementiert).  
- **Gemeinsamer Endpoint:** `POST /round/start` verarbeitet Main Bet und Side Bets zusammen.

### 1.3 Definitions, Acronyms, and Abbreviations
- **MainBet:** Haupteinsatz pro Runde.  
- **SideBet:** Zusatzwette auf Kartenereignisse (z. B. Farbe/Suit/Rank der ersten Karte).  
- **Fairness-Payload:** `serverSeed`, `serverSeedHash`, deterministische `drawOrder`.

### 1.4 References
- ../use-cases/uc6-wetten-platzieren.md  
- db/schema.sql (main_bets, side_bets, wallet_transactions, rounds)  
- Backend-Route `round/start`

### 1.5 Overview
Kapitel 2 beschreibt Implementierungsstand, Kapitel 3 den Ablauf, Kapitel 4 das Sequenzdiagramm, Kapitel 5 die abgeleiteten Anforderungen.

---

## 2. Implementierungsstand (aktueller Code)
- **Backend:** `POST /round/start` (auth) nimmt `{betAmount, sideBets[]?}` entgegen. Prüft aktive Runde (verhindert zweite), validiert Einsätze (>0) und Side-Bet-Codes/Payload (max. 5), sperrt User-Balance, prüft Guthaben (Main + Sidebets), legt Round mit Seed/Hash an, teilt 4 Karten deterministisch, speichert MainBet (PLACED) + WalletTx (BET_PLACE), speichert SideBets + WalletTx (falls vorhanden), setzt Status `IN_PROGRESS`, liefert Round-State inkl. Fairness zurück. Keine Idempotency-Keys.  
- **Frontend:** Nur Haupteinsatz-Feld; kein UI für Sidebets/Limits/Quoten. Fehler 401/400/409 werden textlich angezeigt; Balance-Refresh nach Deal/Settle.  
- **Abweichungen:** Keine In-Game-Zeitfenster für Sidebets, keine Idempotenz, keine Vorab-Validierung im UI, keine dynamischen Quoten (Odds fix aus `sidebet_types.baseOdds`).

---

## 3. Flow of Events - Design

### 3.1 Haupt- und Nebenwetten platzieren (aktuelle Umsetzung)
1. Spieler ist eingeloggt und auf der Blackjack-Seite.  
2. Spieler gibt `betAmount` ein (optional `sideBets`).  
3. Backend prüft, ob bereits eine aktive Runde existiert.  
4. Backend sperrt den User-Datensatz (pessimistic lock), validiert Einsatz und Sidebets, prüft Guthaben.  
5. Bei Erfolg: Runde mit Seed/Hash anlegen, Hände erstellen, 4 Karten deterministisch austeilen, MainBet + WalletTx speichern, SideBets + WalletTx speichern, Round-Status auf `IN_PROGRESS` setzen.  
6. Response 201 enthält Round-State (Hände, Bets, Seeds/Hash, Status).  
7. Fehlerfälle: aktive Runde -> 409; zu wenig Guthaben oder ungültige Sidebet -> 400; fehlendes JWT -> 401.

---

## 4. Sequenzdiagramm
```mermaid
sequenceDiagram
  participant FE as Frontend (Blackjack)
  participant API as Round/Bets API
  participant DB as DB

  FE->>API: POST /round/start {betAmount, sideBets[]} (Bearer)
  API->>DB: Check active round for user
  alt Runde aktiv
    API-->>FE: 409 {code:ROUND_IN_PROGRESS}
  else keine aktive Runde
    API->>DB: Validate betAmount>0; validate sideBets (codes/targets/amounts)
    API->>DB: Lock user; check balance >= bet + sum(sideBets)
    alt Guthaben ok
      API->>DB: Create round (serverSeed+hash, status=DEALING)
      API->>DB: Insert dealer+player hands; deal 4 cards deterministisch
      API->>DB: Insert main_bet (PLACED) + wallet_tx (BET_PLACE -bet)
      API->>DB: Insert side_bets + wallet_txs (falls vorhanden)
      API->>DB: Update round status=IN_PROGRESS
      API-->>FE: 201 {round, bets, fairness}
    else zu wenig Guthaben
      API-->>FE: 400 {code:INSUFFICIENT_FUNDS}
    end
  end

  Note over FE: Keine Idempotency-Keys; Schutz via Locks/Status
```

---

## 5. Derived Requirements
- Start/Platzierung nur ohne bestehende aktive Runde (409 sonst).  
- Buchungen (Main + Sidebets) atomar in einer DB-Transaktion mit Sperre auf User.  
- Maximale Anzahl Sidebets (aktuell 5) begrenzen; Beträge > 0, Summenprüfung gegen Balance.  
- RNG-Fairness: `serverSeed` + `serverSeedHash` + deterministische `drawOrder` zurückliefern.  
- Antwortzeit < 1 s im Normalfall.  
- Klare Fehlercodes für aktive Runde, ungültige Sidebets und unzureichendes Guthaben.  
- Optionaler Ausbau: Idempotency-Key, In-Game-Sidebet-Fenster, UI-Validierung und Quotenanzeige.

---

## 2. Overall Description
- **Product Perspective:** Teil der Blackjack-Domäne; nutzt Round-, Wallet- und Fairness-Komponenten.  
- **Product Functions:** Main- und Sidebets validieren, Guthaben prüfen, Round anlegen, Seeds setzen, Bets speichern.  
- **User Characteristics:** Eingeloggte Spieler, Grundverständnis von Einsatz und Nebenwetten.  
- **Constraints:** JWT-Auth; keine parallele aktive Runde; Max. 5 Sidebets; Decimal/Int für Beträge.  
- **Assumptions/Dependencies:** UC5 (Runde starten), UC7 (Spielzug), UC2 (Wallet-Saldo), UC1 (Auth).  
- **Requirements Subset:** Fokus auf Platzierung beim Rundenstart, keine In-Game-Sidebets.

## 3. Specific Requirements
### 3.1 Functionality
- FR1: System muss active-round-Check durchführen (sonst 409).  
- FR2: System muss MainBet > 0 und Sidebets (Code/Ziel/Betrag) validieren.  
- FR3: System muss Guthaben >= Summe Einsätze prüfen und bei Erfolg belasten.  
- FR4: System muss Round mit Seed/Hash anlegen, Hände/Karten initial geben.  
- FR5: System muss MainBet/Sidebets + WalletTxs persistieren und Status `IN_PROGRESS` setzen.  
- FR6: Fehlercodes 400/401/409 bei Invalidität, Auth-Fehlern oder aktiver Runde.

### 3.2 Usability
- U1: Fehlermeldungen klar (aktive Runde, zu wenig Guthaben, ungültige Sidebet).  
- U2: Response enthält vollständigen Round-State zur UI-Anzeige.

### 3.3 Reliability
- R1: Atomare Transaktion mit Sperre verhindert Race/Doppelbuchung.  
- R2: Keine Buchung bei fehlgeschlagener Validierung (Rollback).

### 3.4 Performance
- P1: Antwortzeit < 1 s im Normalfall.  
- P2: Deck-Erzeugung deterministisch ohne externe Latenz.

### 3.5 Supportability
- S1: Logging von `userId`, Einsätzen, sidebet_codes, requestId.  
- S2: Konfigurierbare Limits/SidebetTypes in DB.

### 3.6 Design Constraints
- DC1: JWT/HTTPS, MySQL/TypeORM, Decimal Beträge.  
- DC2: Max. Sidebets 5 (konfigurierbar).

### 3.7 Online User Documentation and Help System Requirements
- H1: API-Doku für `/round/start` mit Payload/Fehlercodes.

### 3.8 Purchased Components
- PC1: Keine.

### 3.9 Interfaces
- **User Interfaces:** Blackjack-UI für Einsatz/Sidebets (noch rudimentär).  
- **Hardware Interfaces:** Keine.  
- **Software Interfaces:** REST `/round/start`; DB-Tabellen `rounds`, `main_bets`, `side_bets`, `wallet_transactions`.  
- **Communications Interfaces:** HTTPS, JSON, JWT.

### 3.10 Licensing Requirements
- Keine.

### 3.11 Legal, Copyright, and Other Notices
- Datenschutz: keine sensiblen Daten in Logs/Responses.

### 3.12 Applicable Standards
- HTTPS, JWT, ACID-Transaktionen.

## 4. Supporting Information
- Sequenzdiagramm in Abschnitt 4.  
- Aktivitaten und Anforderungen in Abschnitt 3.1/5 beschrieben.



