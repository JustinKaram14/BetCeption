# Use Case 11 – XP und Level-System verwalten

## 1. Brief Description
Dieser Use Case beschreibt das Level- und Erfahrungspunktesystem (XP-System).  
Nach jedem Spiel erhält der Spieler XP abhängig von seiner Leistung, z. B. Gewinnhöhe, Wetteinsatz oder besonderen Aktionen.  
Erreicht der Spieler eine bestimmte XP-Schwelle, steigt er im Level auf und schaltet neue Power-Ups oder Features frei.

---

## 2. Mockup

---

<!--
## 3. Screenshots

---
-->
## 3. Flow of Events

### 3.1 Basic Flow
1. Spiel wird beendet.
2. Das System berechnet die XP auf Grundlage des Ergebnisses.
3. XP werden zum Spielerprofil hinzugefügt.
4. System prüft, ob die Levelgrenze erreicht wurde.
5. Wenn ja:
   - Level wird erhöht.
   - Neue Power-Ups oder Features werden freigeschaltet.
   - Eine Benachrichtigung wird angezeigt.
6. System speichert aktualisierte XP- und Leveldaten in der Datenbank.

---
## Sequenzdiagramm
<img width="1201" height="1048" alt="unnamed_xp" src="https://github.com/user-attachments/assets/99e94b4a-5e93-4c29-8720-943e52d1f229" />

---

## 3.2 Alternative Flows
- **Spiel wird abgebrochen:**  
  Es werden keine XP vergeben.
- **Serverfehler:**  
  XP-Berechnung wird wiederholt oder transaktional gespeichert.

---

## 4. Special Requirements
- XP-Formel muss serverseitig definiert und überprüfbar sein.
- Level-Grenzen und Belohnungen sollen konfigurierbar sein.
- Alle Änderungen werden protokolliert.

---

## 5. Preconditions
- Spieler hat ein Spiel abgeschlossen.
- Spielerprofil existiert.

---

## 6. Postconditions
- XP und Level werden aktualisiert.
- Freischaltbare Power-Ups sind aktiviert.
- Änderungen sind in der Datenbank gespeichert.

---

<!--
## 8. Save changes / Sync with server
System synchronisiert XP und Level nach jedem Spielabschluss automatisch mit dem Server.

---

## 9. Function Points
- XP-Berechnung
- Level-Up-Validierung
- Belohnungen freischalten
- Spielerprofil speichern


-->
