# Use Case 3 – Daily Reward abholen

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem **eingeloggten Spieler**, einmal pro Tag eine **tägliche Belohnung (Coins)** zu erhalten.  
Beim Login oder beim Aufruf der Reward-Funktion prüft das System das **letzte Belohnungsdatum**.  
Wenn mehr als 24 Stunden vergangen sind oder ein neuer Kalendertag begonnen hat, wird dem Spieler die Belohnung gutgeschrieben.

---

## 1.2 Mockup
**Mockup:**  
- Anzeige in der Lobby: „Daily Reward verfügbar!“  
- Button: **„Belohnung abholen“**  
- Anzeige: Nächste Belohnung in **HH:MM:SS**  
- Erfolgsmeldung nach Abholung: „+250 Coins“  

*(Mockup-Bilder werden später eingefügt.)*

---

## 1.3 Screenshots
- Lobby mit Daily Reward Button  
- Erfolgsmeldung nach Abholung  
- Countdown-Ansicht, wenn Belohnung noch nicht verfügbar ist  

*(Screenshots folgen.)*

---

## 2. Flow of Events

### 2.1 Basic Flow
1. Spieler ist eingeloggt (UC2).  
2. Das System liest `last_daily_reward_at` aus der Datenbank.  
3. Das System prüft, ob der Spieler anspruchsberechtigt ist:  
   - mehr als 24 Stunden seit letzter Belohnung **oder**  
   - neuer Kalendertag (UTC).  
4. Wenn ja:  
   - Coins werden dem Konto gutgeschrieben.  
   - Transaktion wird geloggt.  
   - `last_daily_reward_at` wird aktualisiert.  
   - Erfolgsmeldung wird angezeigt.  
5. Wenn nein:  
   - System zeigt Countdown, wann die nächste Belohnung verfügbar ist.

---

### Sequenz Diagram
```

```

---

### .feature File
```
Feature: Daily Reward abholen
  Scenario: Spieler holt Reward nach 24h ab
    Given ein Spieler ist eingeloggt
    And sein letzter Reward war vor mehr als 24 Stunden
    When er auf "Belohnung abholen" klickt
    Then werden Coins gutgeschrieben
    And das Datum wird aktualisiert
```

---

### 2.2 Alternative Flows

**a) Nicht eingeloggt:**  
→ System verweigert Zugriff und leitet zu **UC2 – Login** weiter.

**b) Doppelklick / gleichzeitige Anfrage:**  
→ Server prüft Idempotenz; Belohnung wird nur einmal vergeben.

**c) Serverzeit ≠ Clientzeit:**  
→ System prüft ausschließlich **Serverzeit (UTC)**, Countdown ist rein visuell.

**d) Verbindung bricht nach Gutschrift ab:**  
→ Beim erneuten Öffnen sieht der Spieler den aktualisierten Kontostand.

---

## 3. Special Requirements
- Belohnung kann **fix** (z. B. 250 Coins) oder **zufällig** (z. B. 100–500 Coins) sein.  
- Zeitprüfung basiert auf **Serverzeit (UTC)**.  
- Operation ist **atomar und idempotent** (keine Doppelbelohnungen).  
- Audit-Log wird erstellt mit:
  - user_id  
  - amount  
  - reason = "daily_reward"  
  - timestamp  
- Response enthält:  
  `{ claimed_amount, new_balance, eligible_at }`

---

## 4. Preconditions
- Spieler ist **eingeloggt** (UC2).  

---

## 5. Postconditions
- Bei Erfolg:  
  - Coins wurden gutgeschrieben.  
  - `last_daily_reward_at` wurde aktualisiert.  
  - Transaktion ist in der Datenbank gespeichert.  
- Bei Nicht-Berechtigung:  
  - Keine Änderung an Guthaben oder Zeitstempel.  
  - Countdown wird angezeigt.

---

### 5.1 Save changes / Sync with server
**Persistente Felder (MySQL):**
- `users.last_daily_reward_at`
- `users.balance`
- `wallet_transactions` (user_id, amount, type='credit', reason='daily_reward')

**Synchronisation:**  
Client erhält `new_balance`, `claimed_amount`, `eligible_at` und aktualisiert die Anzeige.

---

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Eligibility-Check | Zeitprüfung 24h / Kalendertag | 2 |
| Reward-Ermittlung | Fix oder zufällig | 2 |
| Transaktion & Audit | Datenbank-Update + Logging | 2 |
| UI-Feedback | Erfolgsmeldung & Countdown | 1 |
| **Gesamt** |  | **7 FP** |

---

## 7. Technische Hinweise
**API-Endpoint:**
```
POST /api/rewards/daily/claim
Authorization: Bearer <JWT>
```

**Antworten:**
```
200 OK { claimed_amount, new_balance, eligible_at }
409 Conflict { error: "not_eligible", eligible_at }
```

**Pseudo-Code (Server):**
```pseudo
if !isEligible(user.last_daily_reward_at):
    return 409, { eligible_at: nextTime() }

amount = randomBetween(min, max)
with transaction:
    user.balance += amount
    user.last_daily_reward_at = nowUTC()
    insert(wallet_transactions, user, amount, "daily_reward")
return 200, { claimed_amount: amount, new_balance: user.balance }
```

---
