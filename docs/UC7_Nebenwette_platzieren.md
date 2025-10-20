# Use Case 7 - Nebenwette platzieren (Karten-Typ, Farbe, Wert)

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem **eingeloggten Spieler**, zusätzlich zur Hauptwette **Nebenwetten** auf Ereignisse rund um die nächsten Karten zu platzieren - z. B. auf **Farbe (♠/♣/♥/♦)**, **Rang (2-A)**, **konkrete Karte (z. B. Pik-Bube)** oder **Muster** (z. B. Paar, gleiche Farbe).  
Nebenwetten können **vor Spielstart** (Pre-Deal) oder **während des Spiels** (In-Game) platziert werden - je nach Regelwerk und Fenster. Das System prüft Einsatz, Limits, Spielstatus und wertet die Nebenwette bei Eintritt des Ereignisses **automatisch** aus.

---

## 1.2 Mockup
(Mockup folgt später)

---

<!--
## 1.3 Screenshots
- Nebenwetten-Panel vor Platzierung
- Bestätigung nach Platzierung (mit Quote)
- Auflösung/Ergebnis (win/lose) nach Eintreten des Ereignisses


---
-->
## 2. Flow of Events

### 2.1 Basic Flow
1. Spieler ist **eingeloggt** (UC2) und hat ein **aktives Spiel** (UC5).  
2. Spieler öffnet das **Nebenwetten-Panel**.  
3. Spieler wählt **Wetten-Typ**, **Ziel** (z. B. Rang/Farbe/konkrete Karte) und **Einsatz**.  
4. Client fordert beim Server die **aktuelle Quote** für die gewählte Nebenwette an.  
5. Spieler bestätigt die Nebenwette.  
6. Server validiert **Guthaben, Limits, Zeitfenster** (Pre-Deal/Next-Card-Fenster, keine geschützten Phasen).  
7. Bei Erfolg: System **bucht Einsatz**, speichert **Nebenwette (status=open)** und liefert **Quote** + **potenzielle Auszahlung**.  
8. Beim **Ereigniszeitpunkt** (z. B. nächste Karte aufgedeckt) **wertet** der Server die Nebenwette aus und setzt `status` auf **won/lost**, erzeugt ggf. **Auszahlung**.

---

### Sequenz Diagram (Text)
<img width="1713" height="1267" alt="unnamed_n" src="https://github.com/user-attachments/assets/dfe17e6c-f144-4678-adab-c225e48c883e" />

---

### .feature File
<!--
```
Feature: Nebenwette platzieren
  Scenario: Spieler platziert eine gültige Nebenwette auf die nächste Karte
    Given der Spieler ist eingeloggt und ein aktives Spiel läuft
    And er hat genügend Guthaben
    When er eine Nebenwette auf "Herz" mit Einsatz 20 platziert
    Then wird die Nebenwette gespeichert mit Status "open"
    And beim Aufdecken der nächsten Karte wird die Nebenwette ausgewertet
```
 -->
 Nicht erforderlich für diesen Use Case, kann später für automatisierte Tests ergänzt werden.

---

### 2.2 Alternative Flows
**a) Nicht eingeloggt / kein aktives Spiel:**  
→ 401/409 - Aktion nicht erlaubt, Verweis auf **UC2** bzw. **UC5**.

**b) Zeitfenster geschlossen (z. B. während Dealer zieht):**  
→ 409 - *„Nebenwetten sind derzeit nicht erlaubt.“*

**c) Ungültiges Ziel / Kombination:**  
→ 400 - *„Ungültige Wettkonfiguration.“*

**d) Nicht genügend Guthaben / über Limit:**  
→ 400 - *„Nicht genügend Guthaben“* bzw. *„Einsatz außerhalb des erlaubten Bereichs“*.

**e) Idempotente Doppelabgabe:**  
→ 200 idempotent success mit vorherigem Resultat (Request-Key).

**f) Spiel endet vor Auswertung (z. B. Abbruch/Disconnect):**  
→ Nebenwette wird regelkonform **storniert** oder **als lost** gewertet - abhängig vom Zeitpunkt; Betrag ggf. **rückerstattet**.

---


## 3. Special Requirements
- **Zeitfenstersteuerung**: Server erzwingt Pre-Deal/In-Game-Fenster; keine Bets während „locked“-Phasen.
<!--
- **Quotenmodell**: serverseitig berechnet (Fairness + House Edge), Beispiel:  
  - Farbe (rot/schwarz bzw. Suit)  
  - Rang (z. B. Ass)  
  - Konkrete Karte (Suit + Rang)  
  - Muster (Paar, gleiche Farbe, Straight-Ansatz - wenn regelkonform)  
- **RNG/Integrität**: Kartenfolge bereits deterministisch (Seed/Commit-Reveal) oder CSPRNG; Nebenwetten **beeinflussen** die Karten **nicht**.  
- **Atomare Transaktionen** für Einsatzabbuchung & Bet-Speicherung.  
- **Audit-Log** (user_id, game_id, side_bet_id, type, target, odds, stake, created_at, request_id).  
- **Anzahl paralleler Nebenwetten** pro Spiel begrenzen (Konfiguration).  
- **Responsible Gaming**: Limits/Abkühlzeiten einhalten.  
- **Mehrsprachige UI** & Währung als Integer (Coins).
-->
---

## 4. Preconditions
- Spieler ist **eingeloggt** (UC2).  
- **Aktives Blackjack-Spiel** existiert (UC5).  
- Zeitfenster für die gewählte Nebenwette ist **offen**.

---

## 5. Postconditions
- **Bei Platzierung:** Nebenwette mit Status **open** gespeichert, Einsatz gebucht.  
- **Nach Ereignis:** Nebenwette auf **won/lost** gesetzt; ggf. **Auszahlung** gutgeschrieben.  
- **UI** aktualisiert Liste/Saldo.

---

<!--
### 5.1 Save changes / Sync with server
**Datenbank (Beispiel):**
```sql
CREATE TABLE side_bets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  game_id BIGINT NOT NULL,
  type VARCHAR(32) NOT NULL,        -- suit|rank|exact_card|pair|suit_match|...
  target VARCHAR(16) NOT NULL,      -- e.g. "HEARTS" | "ACE" | "JACK_SPADES"
  odds_num INT NOT NULL,            -- z. B. 3
  odds_den INT NOT NULL,            -- z. B. 1  -> Quote 3:1
  stake BIGINT NOT NULL,            -- Coins
  potential_payout BIGINT NOT NULL, -- stake * odds_num/odds_den
  status ENUM('open','won','lost','canceled') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL,
  settled_at DATETIME NULL,
  request_id VARCHAR(64) UNIQUE NULL
);
```

**Ablauf (vereinfacht):**
```sql
-- Platzierung
START TRANSACTION;
  INSERT INTO side_bets (..., status='open', ...);
  UPDATE users SET balance = balance - :stake
  WHERE id=:uid AND balance >= :stake;
COMMIT;

-- Auswertung (Server-Event "NextCardRevealed")
UPDATE side_bets SET status='won', settled_at=NOW()
WHERE id=:id AND <Hit-Bedingung>;
INSERT INTO wallet_transactions (..., amount=potential_payout, type='credit', reason='side_bet_payout');
UPDATE users SET balance = balance + :potential_payout WHERE id=:uid;
```

**API-Beispiele:**
```
GET  /api/side-bets/odds?type=suit&target=HEARTS
POST /api/side-bets/place  { game_id, type, target, stake, request_id }
GET  /api/side-bets/open?game_id=...   -- laufende Nebenwetten
GET  /api/side-bets/history?game_id=... -- Historie
```

**Responses:**
```json
// Platzierung OK
{ "side_bet_id": 1122, "odds": "3:1", "stake": 20, "potential_payout": 60, "status": "open", "balance": 880 }

// Auswertung Win
{ "side_bet_id": 1122, "status": "won", "payout": 60, "balance": 940 }
```

---
-->

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|---|---|---|
| Quotenabfrage | Dynamische Odds für Typ/Ziel | 2 |
| Validierung & Zeitfenster | Limits, aktives Spiel, Phasen | 2 |
| Platzierung & Persistenz | Einsatz buchen, Bet speichern | 2 |
| Auswertung & Auszahlung | Event-Handler + Buchung | 2 |
| **Gesamt** |  | **8 FP** |

---

<!--
## 7. Technische Hinweise
- **Odds-Engine** kapseln (z. B. Service „OddsService“) mit klarer Schnittstelle.  
- **Idempotency-Key** für jede Platzierung (Header oder Body).  
- **Eventing** (z. B. „NextCardRevealed“) zur Nebenwetten-Abrechnung.  
- **Telemetry**: Metriken (Placed, Open, Settled, Payout Ratio).  
- **Konfigurierbare Limits** pro Typ (max. Stake, max. parallele Side Bets).  
- **Security**: Alle Requests über HTTPS; JWT-Scopes auf game/side-bet beschränken.

---
-->
