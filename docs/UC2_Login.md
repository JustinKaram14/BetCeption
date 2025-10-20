# Use Case 2 – Login

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem bestehenden Benutzer, sich in **BetCeption** anzumelden.  
Der Benutzer gibt seine registrierte E-Mail-Adresse und das Passwort ein.  
Das System überprüft die Anmeldedaten, erstellt eine aktive Sitzung (Session/JWT-Token) und leitet den Benutzer auf die Startseite weiter.

---

## 1.2 Mockup
<img width="418" height="475" alt="image" src="https://github.com/user-attachments/assets/abcf4683-d9da-479e-8520-4e886ab3bc51" />

---

## 2. Flow of Events

### 2.1 Basic Flow
1. Der Benutzer öffnet die **Login-Seite**.  
2. Der Benutzer gibt seine E-Mail und sein Passwort ein.  
3. Das System validiert die Eingaben.  
4. Das System sucht in der Datenbank nach einem Benutzer mit der angegebenen E-Mail.  
5. Wenn ein Konto gefunden wird, wird das Passwort überprüft.  
6. Bei erfolgreicher Authentifizierung wird eine **Session** oder ein **JWT-Token** erstellt.  
7. Das System leitet den Benutzer zur **Startseite / Lobby** weiter.  
8. Falls der Benutzer heute zum ersten Mal einloggt, wird **UC 3 – Daily Reward** ausgelöst.

---

### Sequenzdiagramm
<img width="1153" height="669" alt="unnamed (2)" src="https://github.com/user-attachments/assets/aa546459-1fbf-406e-b89f-5c709745b1db" />

---

### .feature File
*Nicht erforderlich für diesen Use Case, kann später für automatisierte Tests ergänzt werden.*

---

### 2.2 Alternative Flows

**a) Ungültige Eingaben:**  
- Wenn Pflichtfelder leer oder ungültig sind, zeigt das System eine Fehlermeldung:  
  *„Bitte geben Sie E-Mail und Passwort ein.“*

**b) Falsches Passwort:**  
- Das System zeigt eine Fehlermeldung:  
  *„E-Mail oder Passwort ist falsch.“*

**c) Konto existiert nicht:**  
- Das System zeigt an:  
  *„Kein Konto mit dieser E-Mail gefunden.“*  
- Benutzer kann sich registrieren (**UC 1 – Registrieren**).

---

## 3. Special Requirements
- Passwort darf nicht im Klartext gespeichert werden (nur gehasht).  
- Login erfolgt über **HTTPS** zur sicheren Übertragung.  
- JWT-Token oder Session-ID muss **sicher signiert** sein.  
- Session läuft nach einer bestimmten Zeit ab (z. B. 2 Stunden Inaktivität).

---

## 4. Preconditions
- Benutzerkonto existiert in der Datenbank.  
- Benutzer befindet sich auf der **Login-Seite**.  

---

## 5. Postconditions
- Benutzer ist **authentifiziert**.  
- Eine **aktive Session** (oder JWT) ist erstellt.  
- Benutzer hat Zugriff auf alle geschützten Bereiche (z. B. Spiele, Leaderboard).

---

### 5.1 Save changes / Sync with server
- Nach erfolgreicher Anmeldung werden folgende Informationen gespeichert oder aktualisiert:
  - Letztes Login-Datum (für Daily Reward)
  - Session/JWT-Token
  - IP-Adresse (optional für Sicherheit)
- Alle Daten werden serverseitig synchronisiert, um den Benutzerstatus aktuell zu halten.

---

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Formularfelder | E-Mail, Passwort | 2 |
| Validierungslogik | Eingabeprüfung | 1 |
| Authentifizierung | Passwortprüfung + Token-Erstellung | 2 |
| Weiterleitung & Statusupdate | Login-Erfolg | 1 |
| **Gesamt** | | **6 FP** |

---
