# Use Case 4 – Leaderboard anzeigen

## 1.1 Brief Description
Dieser Use Case ermöglicht es dem **eingeloggten Spieler**, die **Bestenliste (Leaderboard)** in **BetCeption** einzusehen.  
Das Leaderboard zeigt die **Top-Spieler** basierend auf Kriterien wie **Gewinnsumme** und **DEPTH** an.  
Die Daten werden vom Server geladen und regelmäßig aktualisiert.

---

## 1.2 Mockup
<img width="777" height="772" alt="Screenshot 2025-10-20 210732" src="https://github.com/user-attachments/assets/48b9146b-cad8-4c9d-9773-595836355ed3" />

---
**2. Akteure:**  
- **Spieler:** Möchte das aktuelle Leaderboard einsehen.  
- **System:** Ruft die aktuellen Punktestände aller Spieler aus der Datenbank ab und zeigt sie an.
---

## 3. Flow of Events

### 3.1 Basic Flow
1. Der Spieler öffnet die **Leaderboard-Seite**.
2. Der Client sendet GET /api/leaderboard?sort=win_sum&page=1 inklusive JWT.
3. Das System validiert das JWT.  
4. Das System lädt die Liste entweder aus dem Cache (Treffer) oder aus der Datenbank (Miss) und aktualisiert danach den Cache.
5. Optional ermittelt das System den eigenen Rang des Spielers.
6. Server sendet die Daten an den Client zurück.  
7. Client zeigt die Daten in einer strukturierten Tabelle an.  
8. Der eigene Rang des Spielers wird hervorgehoben.

   **Fehlerfälle**
   - Bei ungültigem oder fehlendem Token sendet das System 401 Unauthorized. Der Client leitet zur Anmeldung weiter.
   - Bei einem Serverfehler sendet das System 500 Server Error. Der Client zeigt eine Fehlermeldung mit „Erneut versuchen“.
   - Wenn keine Einträge vorhanden sind, sendet das System 200 OK { items: [] }. Der Client zeigt „Noch keine Einträge“.

---

### 5. Sequenzdiagramm
<img width="1268" height="1078" alt="unnamed (4)" src="https://github.com/user-attachments/assets/ab4db5bf-89f2-477e-b0c3-193cc537b75e" />



### 6. .feature File
<!--
```
Feature: Leaderboard anzeigen
  Scenario: Spieler öffnet das Leaderboard
    Given der Spieler ist eingeloggt
    When er die Leaderboard-Seite öffnet
    Then werden die Top-Spieler angezeigt
    And sein eigener Rang wird hervorgehoben
```
-->
Nicht erforderlich für diesen Use Case, kann später für automatisierte Tests ergänzt werden.
---

## 7. Special Requirements
- Leaderboard-Daten werden **serverseitig aggregiert**.  
- Abfrage ist **paginiert** (z. B. 50 Spieler pro Seite).  
- Spielername wird **zensiert oder anonymisiert**, wenn Datenschutz aktiviert ist.  
- Server aktualisiert Daten **periodisch (z. B. alle 5 Minuten)**.  
- Client sollte **Caching** und **Loading-Indikatoren** unterstützen.  
- Sortierung nach:
  - Gewinnsumme (default)
  - DEPTH
- **Highlighting**: eigener Spieler wird visuell hervorgehoben.

---

## 8. Preconditions
- Spieler ist **eingeloggt** (UC2).

---

## 9. Postconditions
- Leaderboard ist erfolgreich geladen und angezeigt.  
- Keine Datenänderungen am Server nötig.

---
<!--
### 5.1 Save changes / Sync with server
- Client sendet Anfrage `GET /api/leaderboard?sort=win_sum`  
- Server antwortet mit JSON-Array der Top-Spieler:  
```
[
  { "rank": 1, "username": "AceMaster", "xp": 5400, "level": 12, "wins": 124500 },
  { "rank": 2, "username": "CardKing", "xp": 4800, "level": 11, "wins": 115000 },
  ...
]
```
- Client zeigt eigene Position basierend auf `user_id` zusätzlich an.

---
-->
## 10. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Datenabruf | Server-API / DB-Abfrage | 2 |
| Darstellung | Tabelle / Karten mit Rang und Filter | 2 |
| Sortier- und Filterlogik | Benutzerinteraktion | 2 |
| Fehlerbehandlung / Caching | Netzwerk & Timeout | 1 |
| **Gesamt** |  | **7 FP** |

---
<!--
## 7. Technische Hinweise
**API-Endpunkte:**
```
GET /api/leaderboard?sort={criteria}&page={n}
Authorization: Bearer <JWT>
```
**Antworten:**
```
200 OK [ { rank, username, xp, level, wins } ]
401 Unauthorized { error: "auth_required" }
500 Internal Server Error { error: "server_error" }
```

**Datenbank (Beispiel):**
```sql
SELECT username, xp, level, total_wins
FROM users
ORDER BY total_wins DESC
LIMIT 50;
```

**Client-Logik:**
- Speichert letzte Serverantwort im Cache.  
- Aktualisiert Daten automatisch alle 5 Minuten.

---
-->
