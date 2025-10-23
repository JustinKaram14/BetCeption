# Use Case – XP und Level-System verwalten

## 1. Brief Description
Dieser Use Case beschreibt das Level- und Erfahrungspunktesystem (XP-System).  
Nach jedem Spiel erhält der Spieler XP abhängig von seiner Leistung, z. B. Gewinnhöhe, Wetteinsatz oder besonderen Aktionen.  
Erreicht der Spieler eine bestimmte XP-Schwelle, steigt er im Level auf und schaltet neue Power-Ups oder Features frei.

---
## 1.2 Wireframe Mockups
![alt text](Wireframe-mockups/mockup-XPBar-wireframe.png)
## 1.3 Mockup
![alt text](mockups/Level-Bar-Mockup.png)
---

<!--
## 3. Screenshots

---
-->
## 2. Akteure:
- **System:** Berechnet und speichert die Erfahrungspunkte (XP) nach Spielende.  
- **Datenbank:** Speichert Spielerlevel, Fortschritt und XP-Daten dauerhaft.

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
## 4. Sequenzdiagramm
![alt text](<Sequenzdiagramme/Sequenzdiagramm XP-Level-System.png>)
---

## 5. Aktivitätsdiagramm
![alt text](<Aktivitätsdiagramme/Aktivitätsdiagramm XP-Level.png>)

---

## 6. Special Requirements
- XP-Formel muss serverseitig definiert und überprüfbar sein.
- Level-Grenzen und Belohnungen sollen konfigurierbar sein.
- Alle Änderungen werden protokolliert.

---

## 7. Preconditions
- Spieler hat ein Spiel abgeschlossen.
- Spielerprofil existiert.

---

## 8. Postconditions
- XP und Level werden aktualisiert.
- Freischaltbare Power-Ups sind aktiviert.
- Änderungen sind in der Datenbank gespeichert.

---



## 9. Function Points

| Kategorie      | Beschreibung                                           | Function Points |
|----------------|--------------------------------------------------------|-----------------|
| Eingaben       | Übermittlung des Spielergebnisses / Spielausgangs      | 1 FP            |
| Ausgaben       | Aktualisierte XP- und Levelanzeige                     | 2 FP            |
| Abfragen       | Aktuelles Level und XP-Stand aus der Datenbank         | 2 FP            |
| Interne Logik  | Berechnung für XP-Zuwachs und Levelaufstieg            | 2 FP            |
| **Gesamt**     |                                                        | **7 FP**        |

---