# Use Case 12 – Inventar anzeigen

## 1. Brief Description
Dieser Use Case ermöglicht es dem Spieler, alle gekauften und noch nicht genutzten Power-Ups im Inventar einzusehen.  
Das Inventar zeigt den aktuellen Bestand, die Effekte der Power-Ups sowie den Verfügbarkeitsstatus an.

---

## 2. Mockup

---
<!--
## 3. Screenshots
---
-->
## 3. Flow of Events

### 3.1 Basic Flow
1. Spieler öffnet das Inventar-Menü.
2. Das System überprüft den Login-Status.
3. System ruft alle im Besitz befindlichen Power-Ups aus der Datenbank ab.
4. Power-Ups werden mit Icons, Namen, Effekten und Verfügbarkeit angezeigt.
5. Spieler kann Details einzelner Power-Ups einsehen.
---
## Sequenzdiagramm
<img width="883" height="786" alt="unnamed_inv" src="https://github.com/user-attachments/assets/0edc2b9d-242b-48db-a11b-9e75d8a1ade0" />

---

## 3.2 Alternative Flows
- **Kein Power-Up vorhanden:**  
  Das System zeigt eine leere Inventar-Seite mit Hinweis „Keine Power-Ups vorhanden“.
- **Verbindungsfehler:**  
  Eine Fehlermeldung wird angezeigt, Inventar bleibt leer.

---

## 4. Special Requirements
- Anzeige muss in Echtzeit mit der Datenbank synchronisiert sein.
- Items sollen nach Kategorie oder Level sortierbar sein.

---

## 5. Preconditions
- Spieler ist eingeloggt.

---

## 6. Postconditions
- Keine (reine Anzeige).

---
<!--
## 8. Save changes / Sync with server
Das System ruft regelmäßig Inventardaten vom Server ab und aktualisiert die Anzeige automatisch.

---

## 9. Function Points
- Inventar öffnen
- Daten laden
- Sortieren und filtern
- Details anzeigen
-->
