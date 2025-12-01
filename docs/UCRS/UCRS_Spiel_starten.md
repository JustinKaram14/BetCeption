## Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 02.12.2025 | 1.0 | UCRS für Spiel starten (Blackjack) erstellt | Team BetCeption |

# BetCeption  
## Use-Case-Realization Specification: Spiel starten (Blackjack)  
Version 1.0  

---

## 1. Introduction
Diese UCRS beschreibt die technische Realisierung des Use Cases **Spiel starten (Blackjack)** (UC5). Sie dokumentiert, wie Frontend, Backend und Datenbank beim Anstoßen einer neuen Runde zusammenarbeiten, inklusive Einsatzvalidierung, Seed/Hash-Fairness und initialem Kartendeal.

### 1.1 Purpose
Eine neue Blackjack-Runde sicher und deterministisch starten, den Einsatz verbuchen und den initialen Spielzustand an den Client liefern.

### 1.2 Scope
- Start einer Runde über `POST /round/start` mit Haupteinsatz und optionalen Sidebets.  
- Sperre/Validierung von Guthaben, Anlegen von Round/MainBet/SideBets, RNG-Seed/Hash.  
- Rückgabe des vollständigen Round-States inkl. Fairness-Payload.

### 1.3 Definitions, Acronyms, and Abbreviations
- **Round:** Spielrunde mit Status, Server-Seed und Hash.  
- **MainBet / SideBet:** Haupteinsatz und optionale Nebenwetten.  
- **Fairness-Payload:** `serverSeed`, `serverSeedHash`, `drawOrder`.

### 1.4 References
- UC5_Spiel_starten.md  
- db/schema.sql (Rounds, Hands, Cards, MainBets, SideBets, WalletTransactions)  
- Backend-Route `round/start`

### 1.5 Overview
Kapitel 2 beschreibt den Implementierungsstand, Kapitel 3 den Ablauf, Kapitel 4 das Sequenzdiagramm und Kapitel 5 die abgeleiteten Anforderungen.

---

## 2. Implementierungsstand (aktueller Code)
- **Backend:**  
  - `POST /round/start` (auth) mit `{betAmount, sideBets?}`. Prüft aktive Runde, sperrt User-Balance, validiert Einsatz > 0, validiert Sidebets, prüft Guthaben, zieht Gesamteinsatz ab. Legt Round mit Server-Seed/Hash an, erstellt Dealer-/Player-Hände, teilt deterministisch 4 Karten (ab Wechsel-Reihenfolge), speichert MainBet (PLACED) + WalletTx (BET_PLACE), SideBets + WalletTx (falls vorhanden), setzt Status `IN_PROGRESS`, antwortet mit vollem Round-State inkl. Fairness-Payload.  
- **Frontend:** Blackjack-View ruft `startRound` nur mit `betAmount` auf, zeigt Karten/Status/Blackjack-Banner. Kein UI für Sidebets, kein Round-Guard; 401 wird als Fehlertext angezeigt. Balance wird nach Deal/Settle neu geladen.  
- **Abweichungen:** Keine Lobby-Weiterleitung, kein separater Reservierungsschritt; Start nur, wenn keine aktive Runde existiert (sonst 409 `ROUND_IN_PROGRESS`). Sidebet-UI fehlt; RNG-Seed wird direkt mitgeliefert (nicht erst nach Runde).

---

## 3. Flow of Events - Design

### 3.1 Runde starten
1. Spieler ist eingeloggt und auf der Blackjack-Seite.  
2. Spieler gibt `betAmount` ein (optional Sidebets, derzeit nur Backend).  
3. Backend prüft, ob bereits eine aktive Runde existiert.  
4. Backend sperrt den User-Datensatz, validiert Einsatz und Sidebets, prüft Guthaben.  
5. Bei Erfolg: Round mit Seed/Hash anlegen, Hände erstellen, 4 Karten deterministisch austeilen, MainBet + WalletTx speichern, SideBets + WalletTx (falls übergeben), Round-Status auf `IN_PROGRESS` setzen.  
6. Response 201 enthält Round-State (Hände, Bets, Seeds/Hash, Status).  
7. Fehlerfälle: aktive Runde -> 409; zu wenig Guthaben -> 400; ungültige Sidebets -> 400; fehlendes JWT -> 401.

---

## 4. Sequenzdiagramm
```mermaid
sequenceDiagram
  participant FE as Frontend (Blackjack)
  participant API as Round API
  participant DB as DB

  FE->>API: POST /round/start {betAmount, sideBets?} (Bearer)
  API->>DB: Check active round for user
  alt Runde aktiv
    API-->>FE: 409 {code:ROUND_IN_PROGRESS}
  else keine aktive Runde
    API->>DB: Lock user; validate betAmount>0
    API->>DB: Validate sideBets (types, max 5)
    API->>DB: Check balance >= betAmount + sum(sideBets)
    alt Guthaben ok
      API->>DB: Create round (serverSeed + hash, status=DEALING)
      API->>DB: Insert dealer+player hands; deal 4 cards deterministisch
      API->>DB: Insert main_bet (PLACED) + wallet_tx (BET_PLACE -bet)
      API->>DB: Insert side_bets + wallet_txs (falls vorhanden)
      API->>DB: Update round status=IN_PROGRESS
      API-->>FE: 201 {round, hands, bets, fairness}
    else zu wenig Guthaben
      API-->>FE: 400 {code:INSUFFICIENT_FUNDS}
    end
  end

  Note over FE: Weitere Aktionen siehe UC7 (Hit/Stand/Double/Split)
```

---

## 5. Derived Requirements
- Start nur ohne bestehende aktive Runde (sonst 409).  
- Einsatz- und Sidebet-Belastungen müssen atomar in einer DB-Transaktion erfolgen (pessimistic lock auf User).  
- RNG-Fairness: Server liefert `serverSeed` + `serverSeedHash` und deterministische `drawOrder`.  
- Antwortzeit < 1 s im Normalfall; maximal 5 Sidebets.  
- Fehlermeldungen für unzureichendes Guthaben, ungültige Sidebets oder fehlende Authentifizierung.  
- Frontend muss Runde/Balance nach Start aktualisieren und Fehler anzeigen.  

---

## 2. Overall Description
- **Product Perspective:** Einstiegspunkt in die Blackjack-Runde; nutzt Round/Fairness/Wallet-Module.  
- **Product Functions:** Runde anlegen, Seed/Hash setzen, initiale Karten austeilen, Bets verbuchen.  
- **User Characteristics:** Eingeloggt, kennt Einsatzhöhe; keine Sidebet-UI.  
- **Constraints:** Keine parallele aktive Runde; Auth erforderlich; Beträge decimal/int.  
- **Assumptions/Dependencies:** UC2 (Wallet), UC6 (Bets), UC1 (Auth), UC7 (Folgezüge).  
- **Requirements Subset:** Sidebets nur optional im Start; kein Lobby-Flow.

## 3. Specific Requirements
### 3.1 Functionality
- FR1: System muss prüfen, dass keine aktive Runde existiert (409 sonst).  
- FR2: System muss `betAmount` > 0 prüfen, Sidebets validieren.  
- FR3: System muss Guthaben prüfen und bei Erfolg belasten.  
- FR4: System muss Round mit Seed/Hash anlegen, initial 4 Karten deterministisch austeilen.  
- FR5: System muss MainBet (+WalletTx) und Sidebets (+WalletTx) speichern, Status `IN_PROGRESS` setzen.  
- FR6: Response 201 mit Round-State, Seeds/Hash, Bets; Fehler 400/401/409 bei Verstößen.

### 3.2 Usability
- U1: Klare Fehlermeldungen (aktive Runde, Guthaben).  
- U2: Response vollständig für UI (Karten, Status, Bets, Fairness).

### 3.3 Reliability
- R1: Transaktion mit Sperre garantiert atomare Buchung.  
- R2: Deterministische Kartenfolge pro Seed.

### 3.4 Performance
- P1: Antwortzeit < 1 s.  
- P2: Max. 5 Sidebets, kein externer Call.

### 3.5 Supportability
- S1: Logging `roundId`, Seeds, Einsätze, requestId.  
- S2: Konfigurierbare Limits/SidebetTypes in DB.

### 3.6 Design Constraints
- DC1: JWT/HTTPS, MySQL/TypeORM; Decimal für Einsätze.  
- DC2: Keine aktive Runde parallel.

### 3.7 Online User Documentation and Help System Requirements
- H1: API-Doku `/round/start`.

### 3.8 Purchased Components
- PC1: Keine.

### 3.9 Interfaces
- **User Interfaces:** Blackjack-UI für Einsatz (kein Sidebet-UI).  
- **Hardware Interfaces:** Keine.  
- **Software Interfaces:** REST `/round/start`; DB `rounds`, `hands`, `cards`, `main_bets`, `side_bets`, `wallet_transactions`.  
- **Communications Interfaces:** HTTPS, JSON, JWT.

### 3.10 Licensing Requirements
- Keine.

### 3.11 Legal, Copyright, and Other Notices
- Datenschutzkonform (keine sensiblen Daten in Fehlern/Logs).

### 3.12 Applicable Standards
- HTTPS, JWT, ACID-Transaktionen.

## 4. Supporting Information
- Sequenzdiagramm Abschnitt 4.  
- Aktivitäten Abschnitt 5.

