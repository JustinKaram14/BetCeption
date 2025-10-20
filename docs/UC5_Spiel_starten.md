# Use Case 5 – Spiel starten (Blackjack)

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem **eingeloggten Spieler**, ein neues **Blackjack-Spiel** in **BetCeption** zu starten.  
Der Spieler wählt seinen Einsatz und das System initialisiert das Spiel mit Dealer, Karten und Spielstatus.  
Das Spiel kann anschließend über weitere Use Cases (z. B. UC6 - Wette platzieren, UC8 - Spielzug ausführen) fortgesetzt werden.

---

## 1.2 Mockup
<!--
**Mockup:**  
- Spielübersicht mit folgenden Elementen:
  - Einsatzfeld (Input)
  - Button: **„Spiel starten“**
  - Anzeige: aktuelles Guthaben
  - Kartenplatzhalter (Dealer + Spieler)
- Nach dem Start:
  - Zwei Spieler-Karten, eine Dealer-Karte sichtbar
-->
**(Mockup folgt später.)**

---
<!--
## 1.3 Screenshots
- Startseite des Spiels mit Einsatzfeld  
- Nach Start: Tisch mit Karten  
- Anzeige von Einsatz und Guthaben  

*(Screenshots folgen später.)*

---
-->
## 2. Flow of Events

### 2.1 Basic Flow
1. Spieler ist **eingeloggt** (UC2).  
2. Spieler navigiert zur **Blackjack-Spielseite**.  
3. Das System zeigt das aktuelle Guthaben an.  
4. Spieler gibt seinen **Einsatzbetrag** ein.  
5. System prüft, ob genügend Guthaben vorhanden ist.  
6. Wenn ja:
   - Betrag wird reserviert bzw. abgezogen.
   - Neues Spielobjekt wird erstellt (Status: *running*).
   - Spieler- und Dealer-Karten werden initial verteilt.
   - Spielstatus wird gespeichert.
7. Spieloberfläche zeigt den aktuellen Zustand (Karten, Einsatz, Optionen).

---

### Sequenz Diagram
<img width="1553" height="1324" alt="unnamed_s" src="https://github.com/user-attachments/assets/ad209437-e37c-48f0-8cb0-fd5a000dc973" />

---

### .feature File
<!--
```
Feature: Spiel starten (Blackjack)
  Scenario: Spieler startet ein neues Spiel
    Given der Spieler ist eingeloggt
    And er hat genügend Guthaben
    When er einen Einsatz eingibt und auf "Spiel starten" klickt
    Then wird ein neues Spiel initialisiert
    And die Startkarten werden ausgeteilt
```
-->
Nicht erforderlich für diesen Use Case, kann später für automatisierte Tests ergänzt werden.

---

### 2.2 Alternative Flows

**a) Nicht eingeloggt:**  
→ System leitet zur Login-Seite weiter (**UC2**).

**b) Nicht genügend Guthaben:**  
→ System zeigt Fehlermeldung: *„Nicht genügend Guthaben für diesen Einsatz.“*  
→ Spieler bleibt auf der Spielstartseite.

**c) Serverfehler / Timeout:**  
→ Fehlermeldung: *„Spiel konnte nicht gestartet werden. Bitte erneut versuchen.“*

**d) Spiel bereits aktiv:**  
→ System prüft, ob ein laufendes Spiel existiert, und lädt dieses stattdessen.

---

## 3. Special Requirements
- Spiel darf nur gestartet werden, wenn **kein anderes aktives Spiel** besteht.  
- Einsatzbetrag wird **atomar reserviert** (DB-Transaktion).  
- Initiale Kartenverteilung erfolgt **zufällig** über RNG.
  <!--- RNG muss **kryptographisch sicher** sein.--> 
- Server synchronisiert Spielstatus mit Client nach jeder Aktion.
  <!--- Spielstatus wird persistiert in `games`-Tabelle.  -->
<!--- Das Spielobjekt enthält:
  - game_id  
  - player_id  
  - dealer_cards  
  - player_cards  
  - bet_amount  
  - status ("running", "finished")  
  - created_at -->
---

## 4. Preconditions
- Spieler ist **eingeloggt** (UC2).  
- Kein anderes aktives Spiel läuft.  
- Spieler hat ausreichend Guthaben.

---

## 5. Postconditions
- Neues Spielobjekt ist erstellt und gespeichert.  
- Einsatzbetrag ist vom Guthaben abgezogen.  
- Spielstatus = *running*.  
- Karten wurden verteilt.

---
<!--
### 5.1 Save changes / Sync with server
**Persistente Datenbanktabellen (Beispiel):**
```sql
INSERT INTO games (player_id, bet_amount, dealer_cards, player_cards, status, created_at)
VALUES (:player_id, :bet, :dealer_cards, :player_cards, 'running', NOW());
UPDATE users SET balance = balance - :bet WHERE id = :player_id;
```

Server antwortet mit:
```json
{
  "game_id": 123,
  "player_cards": ["10♠", "A♥"],
  "dealer_cards": ["7♣"],
  "balance": 950,
  "status": "running"
}
```
-->
---

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Einsatzprüfung | Guthabenvalidierung | 2 |
| Spielinitialisierung | Karten & Status erstellen | 2 |
| Datenpersistenz | Spiel- und User-Update | 2 |
| UI-Feedback | Darstellung Spielstart & Fehler | 1 |
| **Gesamt** |  | **7 FP** |

---
<!--
## 7. Technische Hinweise
**API-Endpoint:**
```
POST /api/game/start
Authorization: Bearer <JWT>
Body: { "bet_amount": 50 }
```

**Antworten:**
```
200 OK { game_id, player_cards, dealer_cards, balance, status }
400 Bad Request { error: "insufficient_balance" }
409 Conflict { error: "active_game_exists" }
500 Internal Server Error { error: "server_error" }
```

**Serverlogik (Pseudocode):**
```pseudo
if user.balance < bet:
    return 400, { error: "insufficient_balance" }
if existsActiveGame(user.id):
    return 409, { error: "active_game_exists" }

cards = shuffleDeck()
player_cards = draw(cards, 2)
dealer_cards = draw(cards, 1)

transaction:
  insertGame(user.id, bet, player_cards, dealer_cards, "running")
  updateBalance(user.id, -bet)
commit

return 200, { game_id, player_cards, dealer_cards, balance: user.balance - bet, status: "running" }
```

---
-->
