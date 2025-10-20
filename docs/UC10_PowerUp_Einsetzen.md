# Use Case 10 – Power-Up einsetzen

## 1. Brief Description
Dieser Use Case beschreibt, wie ein Spieler ein zuvor gekauftes Power-Up im laufenden Spiel einsetzt.  
Ein Power-Up kann dem Spieler strategische Vorteile bringen, wie z. B. eine zusätzliche Karte, verdoppelte Gewinne oder Schutz vor Verlusten.  
Nach der Nutzung wird das Power-Up aus dem Inventar entfernt.

---

## 2. Mockup
(Mockup folgt später)
---
<!--
## 3. Screenshots

---
-->
## 3. Flow of Events

### 3.1 Basic Flow
1. Spieler befindet sich in einem laufenden Spiel.
2. Spieler öffnet sein Inventar und wählt ein verfügbares Power-Up aus.
3. Das System prüft:
   - Ist das Power-Up im Inventar vorhanden?
   - Ist die Anwendung im aktuellen Spiel erlaubt?
4. Wenn ja:
   - Effekt des Power-Ups wird angewendet.
   - Power-Up wird aus dem Inventar entfernt.
   - Spielstatus wird aktualisiert (z. B. Karte hinzugefügt, Gewinn verdoppelt etc.).
5. System zeigt eine Bestätigung über die erfolgreiche Nutzung an.

---
## Sequenzdiagramm

<img width="1468" height="920" alt="unnamed_up" src="https://github.com/user-attachments/assets/c95d1edd-c215-4259-8af3-d084f19b0acf" />

---

## 3.2 Alternative Flows
- **Power-Up nicht vorhanden:**  
  Das System zeigt eine Fehlermeldung an und bricht den Vorgang ab.
- **Nutzung nicht erlaubt:**  
  Einige Power-Ups dürfen nur in bestimmten Phasen des Spiels verwendet werden.

---

## 4. Special Requirements
- Der Effekt jedes Power-Ups muss klar definiert sein.
- System muss prüfen, dass Effekte nicht gestapelt oder manipuliert werden können.
- Die Anwendung muss serverseitig validiert und synchronisiert werden.

---

## 5. Preconditions
- Spieler ist eingeloggt.
- Spieler befindet sich in einem aktiven Spiel.
- Das Power-Up ist im Inventar vorhanden.

---

## 6. Postconditions
- Effekt des Power-Ups wurde angewendet.
- Power-Up wurde aus dem Inventar entfernt.
- Spielstatus wurde aktualisiert.
- Änderungen wurden in der Datenbank gespeichert.

---
<!--
## 8. Save changes / Sync with server
Das System synchronisiert nach der Nutzung alle Änderungen (Inventar, Spielstatus, XP) mit dem Server, um Datenintegrität sicherzustellen.

---

## 9. Function Points
- Inventar öffnen
- Power-Up auswählen
- Nutzung validieren
- Effekt anwenden
- Inventar aktualisieren
- Spielstatus speichern



-->   
