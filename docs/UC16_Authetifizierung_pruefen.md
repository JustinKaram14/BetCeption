# Use Case 16 – Authentifizierung prüfen

## 1. Brief Description
Dieser Use Case beschreibt die serverseitige Middleware, die bei jedem API-Aufruf prüft, ob der Spieler über einen gültigen Authentifizierungstoken verfügt.  
Nur authentifizierte Benutzer dürfen auf spielbezogene Funktionen zugreifen.

---

## 2. Mockup

---
<!--
## 3. Screenshots

---
-->
## 3. Flow of Events

### 3.1 Basic Flow
1. Spieler sendet eine Anfrage an das System (z. B. Spiel starten, Wette platzieren).
2. Middleware fängt die Anfrage ab und extrahiert das Authentifizierungs-Token.
3. System prüft die Gültigkeit und Ablaufzeit des Tokens.
4. Wenn das Token gültig ist, wird die Anfrage weitergeleitet.
5. Wenn ungültig, erhält der Benutzer eine Fehlermeldung und muss sich neu einloggen.


---
## Sequenzdiagramm
<img width="1005" height="657" alt="unnamed_auth" src="https://github.com/user-attachments/assets/862751ba-5373-4e20-9aab-7a96dad0fbd2" />

---

## 3.2 Alternative Flows
- **Token abgelaufen:**  
  Spieler wird automatisch ausgeloggt und zur Login-Seite weitergeleitet.
- **Token manipuliert:**  
  Anfrage wird blockiert, IP kann gesperrt werden.

---

## 4. Special Requirements
- JWT-basierte Authentifizierung mit Ablaufzeit.
- Middleware muss performant und sicher sein.
- Token müssen signiert und verifiziert werden.

---

## 5. Preconditions
- Spieler hat sich erfolgreich eingeloggt und besitzt ein gültiges Token.

---

## 6. Postconditions
- Zugriff auf geschützte Ressourcen wurde nur bei gültiger Authentifizierung gewährt.

---
<!--
## 8. Save changes / Sync with server
Sitzungsinformationen und Ablaufdaten werden regelmäßig mit dem Server synchronisiert.

---

## 9. Function Points
- Tokenprüfung
- Fehlerbehandlung
- Zugriffskontrolle
-->
