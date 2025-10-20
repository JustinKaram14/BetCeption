# Use Case 14 – Abmelden

## 1. Brief Description
Dieser Use Case beschreibt den Logout-Prozess, bei dem der Spieler seine Sitzung beendet.  
Nach dem Abmelden wird der Zugriff auf alle spielbezogenen Funktionen gesperrt, bis sich der Spieler erneut anmeldet.

---

## 2. Mockup

---
<!--
## 3. Screenshots

---
-->
## 3. Flow of Events

### 3.1 Basic Flow
1. Spieler klickt auf „Logout“.
2. Das System fragt nach einer Bestätigung (optional).
3. Nach Bestätigung wird das Session- oder JWT-Token ungültig gemacht.
4. Spieler wird zur Login-Seite weitergeleitet.
5. System zeigt eine Meldung „Erfolgreich abgemeldet“.

---
## Sequenzdiagramm
<img width="785" height="641" alt="unnamed_ab" src="https://github.com/user-attachments/assets/962a9976-73d3-4e97-b413-02aa594105bc" />

---

## 3.2 Alternative Flows
- **Logout abgebrochen:**  
  Benutzer bleibt eingeloggt, keine Änderungen an der Session.
- **Token bereits abgelaufen:**  
  System zeigt Hinweis „Sitzung abgelaufen“, leitet automatisch zum Login weiter.

---

## 4. Special Requirements
- Logout muss serverseitig validiert werden.
- Session oder Token darf nach Logout nicht wiederverwendet werden.
- Cache-Daten werden gelöscht.

---

## 5. Preconditions
- Spieler ist eingeloggt.

---

## 6. Postconditions
- Keine aktive Sitzung.
- Zugriff auf gesicherte Bereiche ist gesperrt.

---
<!--
## 8. Save changes / Sync with server
Sitzungsdaten werden serverseitig invalidiert und alle temporären Daten gelöscht.

---

## 9. Function Points
- Logout initiieren
- Session invalidieren
- Weiterleitung zur Login-Seite
-->
