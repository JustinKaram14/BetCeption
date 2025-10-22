# Use Case 8 – Spielzug ausführen (Hit, Stand, Double, Split)

## 1.1 Brief Description
Dieser Use Case beschreibt, wie ein **eingeloggter Spieler** während eines laufenden Blackjack-Spiels (UC5) einen **Spielzug** ausführt – z. B. **Hit (Karte ziehen)**, **Stand (bleiben)**, **Double (Einsatz verdoppeln + 1 Karte)** oder **Split (Hand teilen)**.  
Das System prüft den **aktuellen Spielstatus**, **Regeln** und **Guthaben**, führt den Spielzug aus, aktualisiert Karten, Status und ggf. XP/Gewinne.

---

## 1.2 Mockup
(Mockup folgt später)


---
<!--
## 1.3 Screenshots
- Nach Start eines Spiels (Karten sichtbar)
- Nach „Hit“ → neue Karte erscheint
- Nach „Stand“ → Dealer spielt aus
- Nach „Double“ → Einsatz verdoppelt, Endergebnis
- Nach „Split“ → zwei Hände sichtbar

*(Screenshots folgen später.)*

---
-->
## 2. Use Case – Spielzug ausführen
**Akteure:**  
- **Spieler:** Führt Aktionen wie „Hit“, „Stand“ oder „Double Down“ aus.  
- **System:** Reagiert auf Spieleraktionen, zieht Karten und aktualisiert den Spielstatus.

---

## 3. Flow of Events

### 3.1 Basic Flow
1. Spieler ist **eingeloggt** (UC2) und hat ein **aktives Spiel (UC5)**.  
2. Spieler wählt eine **Aktion** (Hit, Stand, Double, Split).  
3. Client sendet den Spielzug an den Server.  
4. Server validiert:
   - Gültiger Spielzustand (running)
   - Aktion erlaubt (z. B. Split nur bei Paar)
   - Ausreichend Guthaben (für Double/Split)
5. Server wendet die Aktion an:
   - **Hit**: neue Karte an Spieler.
   - **Stand**: Dealer zieht Karten, bis ≥ 17.
   - **Double**: Einsatz verdoppelt, Karte ziehen, Stand erzwingen.
   - **Split**: Hand aufteilen, zweite Wette erzeugen.
6. Server aktualisiert Spielstatus (`running`, `finished`).
7. System berechnet Sieg/Niederlage, XP und Gewinne.  
8. Ergebnisse werden dem Client gesendet, UI zeigt aktuelle Karten und Balance.

---

### 4. Sequenzdiagramm

<img width="1256" height="2338" alt="unnamed_aus" src="https://github.com/user-attachments/assets/019dd95e-0cd0-4216-a6b7-15e0a29314bf" />

---

### 5. .feature File
<!--
```
Feature: Spielzug ausführen
  Scenario: Spieler zieht eine Karte (Hit)
    Given ein laufendes Blackjack-Spiel
    When der Spieler auf "Hit" klickt
    Then erhält er eine neue Karte
    And das System prüft Bust oder Blackjack
```
-->
Nicht erforderlich für diesen Use Case, kann später für automatisierte Tests ergänzt werden.


---



## 6. Special Requirements
- **Kartenverteilung:** RNG (kryptografisch sicher, deterministisch pro Session).  
- **Game Engine** führt Blackjack-Regeln korrekt aus (Soft 17, Ace as 1/11).  
- **Atomicität:** Jeder Spielzug als Transaktion.
- **XP-/Level-System:** Nach Abschluss XP hinzufügen (UC11).  
- **Protokollierung:** Jeder Zug wird geloggt (`action`, `card`, `timestamp`).  
- **Synchronisation:** Spielstatus konsistent zwischen Client und Server.
- <!-- - **Validierung:** Nur erlaubte Aktionen im aktuellen Zustand.  -->


---

## 7. Preconditions
- Spieler ist **eingeloggt** (UC2).  
- **Aktives Spiel** (UC5) mit Status `running`.  
- Aktion ist laut Spielregeln erlaubt.

---

## 8. Postconditions
- Spielstatus wurde aktualisiert.  
- Karten, Einsatz und Balance ggf. angepasst.  
- Bei Ende: Gewinn/Niederlage & XP berechnet.  
- Änderungen sind persistiert.

---
<!--
### 5.1 Save changes / Sync with server
**Beispiel-Datenstruktur:**
```sql
UPDATE games 
SET player_cards = :cards, 
    status = :status, 
    dealer_cards = :dealer_cards, 
    result = :result, 
    updated_at = NOW() 
WHERE id = :game_id;
```

**API-Endpunkt:**
```
POST /api/game/action
Authorization: Bearer <JWT>
Body: { "game_id": 123, "action": "hit" }
```

**Beispiel-Antwort:**
```json
{
  "game_id": 123,
  "action": "hit",
  "player_cards": ["10♠", "7♦", "4♣"],
  "dealer_cards": ["Q♥", "8♠"],
  "status": "running",
  "balance": 900
}
```

---
-->
## 9. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Validierung | Status, Regeln, Guthaben | 2 |
| Spielengine | Kartenlogik & RNG | 2 |
| Ergebnisberechnung | Gewinn/Niederlage/XP | 2 |
| Persistenz & Sync | DB-Update & Client-Feedback | 1 |
| **Gesamt** |  | **7 FP** |

---
<!--
## 7. Technische Hinweise
- **Engine-Methoden:**  
  - `hit()`, `stand()`, `doubleDown()`, `split()`  
- **Ereignisse:**  
  - `onGameUpdated`, `onGameFinished`
- **Logging:**  
  - `game_actions` Tabelle mit `game_id`, `action`, `cards`, `timestamp`  
- **API-Fehlercodes:**  
  - `400` (ungültige Eingabe), `401` (nicht eingeloggt), `409` (ungültiger Zustand).  
- **Client:** aktualisiert Kartenanzeige, Spielbuttons deaktivieren wenn beendet.

---




-->

