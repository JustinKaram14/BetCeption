# Use Case 6 – Wette platzieren (Hauptwette)

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem **eingeloggten Spieler**, vor dem Start eines Blackjack-Spiels eine **Hauptwette** (Einsatz) zu platzieren.  
Das System prüft **Guthaben**, **Einsatzlimits** und **Spielzustand** und reserviert bzw. belastet den Betrag **atomar**.  
Die Wette ist Grundlage für den weiteren Spielverlauf (UC5 – Spiel starten, UC8 – Spielzug ausführen).

---

## 1.2 Mockup
**Mockup:**  
- Einsatzfeld (Zahlen-Input + Chips-Auswahl)  
- Buttons: **„Setzen“**, **„Zurücksetzen“**  
- Anzeige: aktuelles Guthaben, Mindest-/Höchsteinsatz  
- Hinweis bei Fehlern (z. B. „Nicht genügend Guthaben“)  


---

## 1.3 Screenshots
- Wett-Panel vor Spielbeginn  
- Erfolgsmeldung nach gesetzter Wette  
- Fehlermeldung bei ungültigem Einsatz  

*(Screenshots folgen.)*

---

## 2. Flow of Events

### 2.1 Basic Flow
1. Spieler ist **eingeloggt** (UC2) und befindet sich in der **Lobby** oder auf der **Blackjack-Seite**.  
2. Spieler gibt den **Einsatzbetrag** ein oder wählt Chips.  
3. Client sendet eine Anfrage an den Server, um die **Hauptwette zu platzieren**.  
4. Server validiert: **Einsatzlimits**, **Guthaben**, **kein aktives Spiel mit bereits gesetztem Einsatz**.  
5. Bei Erfolg:
   - Betrag wird **reserviert / abgezogen** (atomare DB-Transaktion).  
   - **Wettobjekt** wird gespeichert (Status: `placed`).  
   - Der aktuelle **Kontostand** wird zurückgegeben.  
6. UI zeigt Bestätigung und ermöglicht **„Spiel starten“** (UC5).

---

### Activity Diagram
```

```

---

### .feature File
```
Feature: Hauptwette platzieren
  Scenario: Spieler platziert eine gültige Hauptwette
    Given der Spieler ist eingeloggt
    And er hat genügend Guthaben
    And der Einsatz liegt zwischen MinBet und MaxBet
    When er die Wette platziert
    Then wird der Einsatz atomar reserviert
    And die Wette ist mit Status "placed" gespeichert
```

---

### 2.2 Alternative Flows

**a) Nicht eingeloggt:**  
→ 401 Unauthorized, Weiterleitung zu **UC2 – Login**.

**b) Ungültiger Einsatz (unter/über Limit):**  
→ 400 Bad Request, Meldung: *„Einsatz liegt nicht im erlaubten Bereich.“*

**c) Nicht genügend Guthaben:**  
→ 400 Bad Request, Meldung: *„Nicht genügend Guthaben.“*

**d) Bereits aktive Wette/Spiel:**  
→ 409 Conflict, Meldung: *„Es existiert bereits eine aktive Wette/Spiel.“*

**e) Race Condition (Doppelklick / Parallelanfragen):**  
→ Idempotenz-Key pro Benutzer/Session; zweite Anfrage wird abgewiesen oder als **idempotent success** beantwortet.

**f) Server-/DB-Fehler:**  
→ 500 Internal Server Error, „Bitte erneut versuchen“. Keine Buchung erfolgt.

---

## 3. Special Requirements
- **Einsatzlimits** konfigurierbar (z. B. `min_bet`, `max_bet`, `step`).  
- **Atomare Transaktion**: Guthabenbuchung und Wettanlage in einem Commit.  
- **Idempotenz-Unterstützung** per Header `Idempotency-Key` oder serverseitig generiertem Request-Key.  
- **Audit-Log**: `user_id`, `amount`, `reason='main_bet'`, `game_context`, `request_id`, `timestamp`.  
- **Währungs-/Einheiten-Handling**: Coins als Integer (keine Fließkommazahlen).  
- **Validierung** sowohl **client-** als auch **serverseitig**.  
- **Konformität** mit Spielregeln (z. B. kein Setzen während eines bereits laufenden Spiels, außer Rebuy-Phase falls vorgesehen).

---

## 4. Preconditions
- Spieler ist **authentifiziert** (UC2).  
- **Kein** laufendes Spiel mit gesetzter Hauptwette **oder** Wette im Status `placed`.  
- Ausreichendes **Guthaben** vorhanden.

---

## 5. Postconditions
- Bei Erfolg:  
  - **Wette** im Status `placed` ist gespeichert (mit `bet_id`).  
  - **Guthaben** ist entsprechend reduziert/reserviert.  
  - **Weiterer Ablauf** kann mit **UC5 – Spiel starten** erfolgen.  
- Bei Misserfolg:  
  - **Keine** Änderungen an Guthaben oder Wetten.

---

### 5.1 Save changes / Sync with server
**Beispiel-Modelle (MySQL):**
```sql
-- Tabelle für Wetten
CREATE TABLE bets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  game_type VARCHAR(32) NOT NULL DEFAULT 'blackjack',
  amount BIGINT NOT NULL,           -- Coins (Integer)
  status ENUM('placed', 'settled', 'canceled') NOT NULL DEFAULT 'placed',
  created_at DATETIME NOT NULL,
  request_id VARCHAR(64) UNIQUE NULL
);

-- Atomare Buchung (vereinfacht)
START TRANSACTION;
  INSERT INTO bets (user_id, game_type, amount, status, created_at, request_id)
  VALUES (:uid, 'blackjack', :amount, 'placed', NOW(), :request_id);

  UPDATE users SET balance = balance - :amount
  WHERE id = :uid AND balance >= :amount;
COMMIT;
```

**Server-Response (Beispiel):**
```json
{
  "bet_id": 98765,
  "amount": 100,
  "status": "placed",
  "balance": 900
}
```

---

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Einsatzvalidierung | Limits, Schrittweite, Format | 2 |
| Guthabenprüfung | Kontostand >= Einsatz | 2 |
| Persistenz & Transaktion | Bets + Balance-Update | 2 |
| Idempotenz & Fehlerhandling | Doppelanfragen, Race-Conditions | 1 |
| **Gesamt** |  | **7 FP** |

---

## 7. Technische Hinweise
**API-Endpoint:**
```
POST /api/bets/main
Authorization: Bearer <JWT>
Body: { "amount": 100, "request_id": "<uuid>" }
```

**Antworten:**
```
200 OK { bet_id, amount, status, balance }
400 Bad Request { error: "invalid_amount" | "insufficient_balance" }
401 Unauthorized { error: "auth_required" }
409 Conflict { error: "active_bet_exists" }
500 Internal Server Error { error: "server_error" }
```

**Server-Pseudocode:**
```pseudo
requireAuth()
validate(amount in [min_bet..max_bet] and amount % step == 0)

with transaction:
  user = lock(select * from users where id=:uid)
  if user.balance < amount: return 400, {error:"insufficient_balance"}
  if existsActiveBet(uid): return 409, {error:"active_bet_exists"}

  bet_id = insertBet(uid, amount, "placed", request_id)
  updateUserBalance(uid, -amount)

return 200, { bet_id, amount, status:"placed", balance:user.balance - amount }
```

---

