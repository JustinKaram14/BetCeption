# Use Case – Daily Reward abholen

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem **eingeloggten Spieler**, einmal pro Tag eine **tägliche Belohnung (Coins)** zu erhalten.  
Beim Login oder beim Aufruf der Reward-Funktion prüft das System das **letzte Belohnungsdatum**.  
Wenn mehr als 24 Stunden vergangen sind oder ein neuer Kalendertag begonnen hat, wird dem Spieler die Belohnung gutgeschrieben.

---
## 1.2 Wireframe Mockups
![alt text](../assets/Wireframe-mockups/Mockup-Daily_Rewards-wirecard.png)
## 1.3 Mockup
![alt text](../assets/mockups/Daily-Rewards.png)

---
<!--
## 1.3 Screenshots
- Lobby mit Daily Reward Button  
- Erfolgsmeldung nach Abholung  
- Countdown-Ansicht, wenn Belohnung noch nicht verfügbar ist  

*(Screenshots folgen.)*

---
-->
**2. Akteure:**  
- **Spieler:** Löst die tägliche Belohnung durch Einloggen aus.  
- **System:** Überprüft das Datum und gewährt die Belohnung einmal pro Tag.
---

## 3. Flow of Events

### 3.1 Basic Flow
1. Der Spieler klickt „Claim“.
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

### 4. Sequenzdiagramm
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Daily-Reward.png>)
---

### 5. Aktivitätsdiagramm
![alt text](<../assets/Aktivitätsdiagramme/Aktivitätsdiagramm Daily-Reward.png>)
---




## 6. Special Requirements
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

## 7. Preconditions
- Spieler ist **eingeloggt** (UC2).  

---

## 8. Postconditions
- Bei Erfolg:  
  - Coins wurden gutgeschrieben.  
  - `last_daily_reward_at` wurde aktualisiert.  
  - Transaktion ist in der Datenbank gespeichert.  
- Bei Nicht-Berechtigung:  
  - Keine Änderung an Guthaben oder Zeitstempel.  
  - Countdown wird angezeigt.

---
<!--
### 5.1 Save changes / Sync with server
**Persistente Felder (MySQL):**
- `users.last_daily_reward_at`
- `users.balance`
- `wallet_transactions` (user_id, amount, type='credit', reason='daily_reward')

**Synchronisation:**  
Client erhält `new_balance`, `claimed_amount`, `eligible_at` und aktualisiert die Anzeige.

---
-->
## 9. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Eligibility-Check | Zeitprüfung 24h / Kalendertag | 2 |
| Reward-Ermittlung | Fix oder zufällig | 2 |
| Transaktion & Audit | Datenbank-Update + Logging | 2 |
| UI-Feedback | Erfolgsmeldung & Countdown | 1 |
| **Gesamt** |  | **7 FP** |

---
<!--
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
-->
