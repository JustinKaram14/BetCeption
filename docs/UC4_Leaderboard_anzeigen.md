# Use Case 4 – Leaderboard anzeigen

## 1.1 Brief Description
Dieser Use Case ermöglicht es dem **eingeloggten Spieler**, die **Bestenliste (Leaderboard)** in **BetCeption** einzusehen.  
Das Leaderboard zeigt die **Top-Spieler** basierend auf Kriterien wie **Gewinnsumme**, **Level**, oder **XP** an.  
Die Daten werden vom Server geladen und regelmäßig aktualisiert.

---

## 1.2 Mockup
**Mockup:**  
- Tabelle oder Kartenansicht mit Spalten:
  - Rang (#)
  - Spielername
  - Level / XP
  - Gewinnsumme (Coins)
- Filter / Sortieroptionen:
  - Sortieren nach: Gewinn, XP, Level
  - Zeitraum: täglich, wöchentlich, gesamt


---

## 1.3 Screenshots
- Leaderboard-Ansicht mit Top-Spielern
- Filter / Sortier-Menü
- Ansicht mit eigenem Rang hervorgehoben

*(Screenshots folgen später.)*

---

## 2. Flow of Events

### 2.1 Basic Flow
1. Spieler ist **eingeloggt** (UC2).  
2. Spieler navigiert zur **Leaderboard-Seite**.  
3. Das System sendet eine Anfrage an den Server, um die aktuellen Leaderboard-Daten zu laden.  
4. Server ruft die Top-Spieler aus der Datenbank ab, sortiert nach dem ausgewählten Kriterium.  
5. Server sendet die Daten an den Client zurück.  
6. Client zeigt die Daten in einer strukturierten Tabelle an.  
7. Der eigene Rang des Spielers wird hervorgehoben.

---

### Activity Diagram
```

```

---

### .feature File
```
Feature: Leaderboard anzeigen
  Scenario: Spieler öffnet das Leaderboard
    Given der Spieler ist eingeloggt
    When er die Leaderboard-Seite öffnet
    Then werden die Top-Spieler angezeigt
    And sein eigener Rang wird hervorgehoben
```

---

### 2.2 Alternative Flows

**a) Nicht eingeloggt:**  
→ System verweigert Zugriff und leitet zu **UC2 – Login** weiter.

**b) Netzwerkfehler / Server nicht erreichbar:**  
→ Fehlermeldung: „Leaderboard konnte nicht geladen werden.“  
→ Button: „Erneut versuchen“

**c) Keine Einträge vorhanden (neue Spieler):**  
→ Anzeige: „Noch keine Einträge verfügbar.“

**d) Serverantwort zu langsam:**  
→ Ladeanimation / „Loading Spinner“ wird angezeigt, bis Daten eintreffen.

---

## 3. Special Requirements
- Leaderboard-Daten werden **serverseitig aggregiert**.  
- Abfrage ist **paginiert** (z. B. 50 Spieler pro Seite).  
- Spielername wird **zensiert oder anonymisiert**, wenn Datenschutz aktiviert ist.  
- Server aktualisiert Daten **periodisch (z. B. alle 5 Minuten)**.  
- Client sollte **Caching** und **Loading-Indikatoren** unterstützen.  
- Sortierung nach:
  - Gewinnsumme (default)
  - Level
  - XP
- **Highlighting**: eigener Spieler wird visuell hervorgehoben.

---

## 4. Preconditions
- Spieler ist **eingeloggt** (UC2).

---

## 5. Postconditions
- Leaderboard ist erfolgreich geladen und angezeigt.  
- Keine Datenänderungen am Server nötig.

---

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

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Datenabruf | Server-API / DB-Abfrage | 2 |
| Darstellung | Tabelle / Karten mit Rang und Filter | 2 |
| Sortier- und Filterlogik | Benutzerinteraktion | 2 |
| Fehlerbehandlung / Caching | Netzwerk & Timeout | 1 |
| **Gesamt** |  | **7 FP** |

---

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

