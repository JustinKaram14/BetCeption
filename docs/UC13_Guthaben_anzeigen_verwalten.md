# Use Case 13 – Guthaben anzeigen / verwalten

## 1. Brief Description
Dieser Use Case ermöglicht es dem Spieler, sein aktuelles Guthaben, Gewinne und Verluste einzusehen.  
Das System zeigt den Kontostand sowie eine Historie aller Transaktionen (Wetten, Gewinne, Käufe, Belohnungen) an.

---

## 2. Mockup

---

<!--
## 3. Screenshots

---
-->
## 3. Flow of Events

### 3.1 Basic Flow
1. Spieler öffnet die Guthaben-Seite.
2. Das System überprüft den Login-Status.
3. Das System ruft das aktuelle Guthaben aus der Datenbank ab.
4. Das System zeigt die Guthabenübersicht sowie die letzten Transaktionen an.
5. Spieler kann Details oder Filteroptionen auswählen (z. B. Zeitraum, Transaktionstyp).
---
## Sequenzdiagramm
<img width="993" height="903" alt="unnamed_gut" src="https://github.com/user-attachments/assets/29463e3b-6779-441a-b62c-4a5c9857cc57" />

---

## 3.2 Alternative Flows
- **Serverfehler / Verbindung verloren:**  
  Eine Fehlermeldung wird angezeigt, Daten werden nicht aktualisiert.
- **Keine Transaktionen vorhanden:**  
  Es wird ein Hinweis „Keine Transaktionen verfügbar“ angezeigt.

---

## 4. Special Requirements
- Guthabenberechnung muss serverseitig erfolgen.
- Transaktionshistorie muss chronologisch und vollständig sein.
- Änderungen (z. B. durch neue Spiele) sollen automatisch synchronisiert werden.

---

## 5. Preconditions
- Spieler ist eingeloggt.

---

## 6. Postconditions
- Guthaben und Historie wurden korrekt angezeigt.

---
<!--
## 7. Save changes / Sync with server
Das System synchronisiert die Daten regelmäßig mit dem Server, um aktuelle Werte sicherzustellen.

---

## 9. Function Points
- Guthaben abrufen
- Transaktionshistorie anzeigen
- Filterung/Sortierung
-->
